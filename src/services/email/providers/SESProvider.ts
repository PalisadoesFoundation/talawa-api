import type { EmailJob, EmailResult, IEmailProvider } from "../types";

/**
 * Configuration for AWS SES Email Provider.
 */
export interface SESProviderConfig {
	/** AWS region (e.g., 'us-east-1'). Required. */
	region: string;
	/** AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles). */
	accessKeyId?: string;
	/** AWS Secret Access Key. Optional if using default credential chain. */
	secretAccessKey?: string;
	/** Default sender email address. */
	fromEmail?: string;
	/** Default sender display name. */
	fromName?: string;
}

// TODO: Consider batching/parallelizing sendBulkEmails for performance in future updates.
// See tracking issue: ISSUE_EMAIL_BATCHING.md (Optimization: Batching and Parallelizing SES Bulk Email Sending)
/**
 * AWS SES implementation of IEmailProvider.
 *
 * This provider uses the @aws-sdk/client-ses to send emails.
 * It lazily initializes the SESClient and Command constructors on first use.
 */
export class SESProvider implements IEmailProvider {
	private config: SESProviderConfig;
	private sesClient: {
		send: (command: unknown) => Promise<{ MessageId?: string }>;
	} | null = null;
	private SendEmailCommandCtor: ((input: unknown) => unknown) | null = null;

	/**
	 * Creates an instance of SESProvider.
	 * @param config - The SES configuration object containing region and credentials.
	 */
	constructor(config: SESProviderConfig) {
		this.config = config;
	}

	private async getSesArtifacts(): Promise<{
		client: { send: (command: unknown) => Promise<{ MessageId?: string }> };
		SendEmailCommand: (input: unknown) => unknown;
	}> {
		if (!this.sesClient || !this.SendEmailCommandCtor) {
			const mod = await import("@aws-sdk/client-ses");

			// Validate region
			if (!this.config.region) {
				throw new Error("AWS_SES_REGION must be a non-empty string");
			}

			// Validate that either both credentials are provided or neither
			const hasAccessKey = Boolean(this.config.accessKeyId);
			const hasSecretKey = Boolean(this.config.secretAccessKey);
			if (hasAccessKey !== hasSecretKey) {
				throw new Error(
					"Both accessKeyId and secretAccessKey must be provided together, or neither should be set",
				);
			}

			this.sesClient = new mod.SESClient({
				region: this.config.region,
				credentials:
					this.config.accessKeyId && this.config.secretAccessKey
						? {
								accessKeyId: this.config.accessKeyId,
								secretAccessKey: this.config.secretAccessKey,
							}
						: undefined,
			}) as {
				send: (command: unknown) => Promise<{ MessageId?: string }>;
			};
			type MinimalSendEmailCommandInput = {
				Source: string;
				Destination: { ToAddresses: string[] };
				Message: {
					Subject: { Data: string; Charset?: string };
					Body: {
						Html: { Data: string; Charset?: string };
						Text?: { Data: string; Charset?: string };
					};
				};
			};
			this.SendEmailCommandCtor = ((input: MinimalSendEmailCommandInput) =>
				new mod.SendEmailCommand(input)) as (input: unknown) => unknown;
		}
		return {
			client: this.sesClient,
			SendEmailCommand: this.SendEmailCommandCtor,
		};
	}

	/**
	 * Send a single email using AWS SES
	 */
	async sendEmail(job: EmailJob): Promise<EmailResult> {
		try {
			if (!this.config.fromEmail) {
				throw new Error(
					"Email service not configured. Please set AWS_SES_FROM_EMAIL (and optionally AWS_SES_FROM_NAME) or run 'npm run setup' to configure SES.",
				);
			}

			const { client, SendEmailCommand } = await this.getSesArtifacts();

			const fromAddress = this.config.fromName
				? `${this.config.fromName} <${this.config.fromEmail}>`
				: this.config.fromEmail;

			const command = SendEmailCommand({
				Source: fromAddress,
				Destination: { ToAddresses: [job.email] },
				Message: {
					Subject: { Data: job.subject, Charset: "UTF-8" },
					Body: {
						Html: { Data: job.htmlBody, Charset: "UTF-8" },
						...(job.textBody
							? { Text: { Data: job.textBody, Charset: "UTF-8" } }
							: {}),
					},
				},
			});

			const response = await client.send(command);
			return { id: job.id, success: true, messageId: response.MessageId };
		} catch (error) {
			return {
				id: job.id,
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Send multiple emails
	 */
	async sendBulkEmails(jobs: EmailJob[]): Promise<EmailResult[]> {
		const results: EmailResult[] = [];
		for (const [i, job] of jobs.entries()) {
			if (!job) continue;
			results.push(await this.sendEmail(job));
			if (i < jobs.length - 1) {
				await new Promise((r) => setTimeout(r, 100));
			}
		}
		return results;
	}
}
