import { ErrorCode } from "../../../utilities/errors/errorCodes";
import { TalawaRestError } from "../../../utilities/errors/TalawaRestError";
import { rootLogger } from "../../../utilities/logging/logger";
import type {
	EmailJob,
	EmailResult,
	IEmailProvider,
	NonEmptyString,
} from "../types";

/**
 * Configuration for AWS SES Email Provider.
 */
export interface SESProviderConfig {
	/** AWS region (e.g., 'us-east-1'). Required. */
	region: NonEmptyString;
	/** AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles). */
	accessKeyId?: string;
	/** AWS Secret Access Key. Optional if using default credential chain. */
	secretAccessKey?: string;
	/** Default sender email address. */
	fromEmail?: string;
	/** Default sender display name. */
	fromName?: string;
}

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

			if (!this.config.region) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "API_AWS_SES_REGION must be a non-empty string",
				});
			}

			const hasAccessKey = Boolean(this.config.accessKeyId);
			const hasSecretKey = Boolean(this.config.secretAccessKey);
			if (hasAccessKey !== hasSecretKey) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message:
						"Both accessKeyId and secretAccessKey must be provided together, or neither should be set",
				});
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
		if (!this.config.fromEmail) {
			throw new TalawaRestError({
				code: ErrorCode.INVALID_ARGUMENTS,
				message:
					"Email service not configured. Please set API_AWS_SES_FROM_EMAIL (and optionally API_AWS_SES_FROM_NAME) or run 'npm run setup' to configure SES.",
			});
		}

		try {
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
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			rootLogger.error(
				{
					error: errorMessage,
					stack: error instanceof Error ? error.stack : undefined,
					jobId: job.id,
				},
				"Failed to send email via SES",
			);
			return {
				id: job.id,
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Sends multiple emails in concurrent batches to respect rate limits.
	 *
	 * Processes the jobs list in chunks (defined by BATCH_SIZE), ensuring a delay
	 * between batches to prevent overwhelming the email provider or hitting rate limits.
	 *
	 * @param jobs - An array of email jobs to be processed.
	 * @returns A promise that resolves to an array of results (success or failure) for each email job.
	 */
	async sendBulkEmails(jobs: EmailJob[]): Promise<EmailResult[]> {
		const BATCH_SIZE = 14;
		const DELAY_BETWEEN_BATCHES_MS = 1000;
		const results: EmailResult[] = [];

		for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
			const batch = jobs.slice(i, i + BATCH_SIZE);

			const batchPromises = batch.map((job) => this.sendEmail(job));

			const batchSettledResults = await Promise.allSettled(batchPromises);

			for (let j = 0; j < batchSettledResults.length; j++) {
				const settled = batchSettledResults[j];
				const currentJob = batch[j];

				if (!settled || !currentJob) continue;

				if (settled.status === "fulfilled") {
					results.push(settled.value);
				} else {
					results.push({
						id: currentJob.id,
						success: false,
						error:
							settled.reason instanceof Error
								? settled.reason.message
								: String(settled.reason),
					});
				}
			}

			if (i + BATCH_SIZE < jobs.length) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS),
				);
			}
		}

		return results;
	}
}
