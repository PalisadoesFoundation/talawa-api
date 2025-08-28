/**
 * Email configuration interface
 */
export interface EmailConfig {
	region: string;
	fromEmail: string;
	fromName?: string;
}

/**
 * Email job interface
 */
export interface EmailJob {
	id: string;
	email: string;
	subject: string;
	htmlBody: string;
	userId: string;
}

/**
 * Email result interface
 */
export interface EmailResult {
	id: string;
	success: boolean;
	messageId?: string;
	error?: string;
}

/**
 * Simple email service using AWS SES
 */
export class EmailService {
	private config: EmailConfig;
	private sesClient: {
		send: (command: unknown) => Promise<{ MessageId?: string }>;
	} | null = null;
	private SendEmailCommandCtor: ((input: unknown) => unknown) | null = null;

	constructor(config: EmailConfig) {
		this.config = config;
	}

	private async getSesArtifacts(): Promise<{
		client: { send: (command: unknown) => Promise<{ MessageId?: string }> };
		SendEmailCommand: (input: unknown) => unknown;
	}> {
		if (!this.sesClient || !this.SendEmailCommandCtor) {
			const mod = await import("@aws-sdk/client-ses");
			this.sesClient = new mod.SESClient({ region: this.config.region }) as {
				send: (command: unknown) => Promise<{ MessageId?: string }>;
			};
			type MinimalSendEmailCommandInput = {
				Source: string;
				Destination: { ToAddresses: string[] };
				Message: {
					Subject: { Data: string; Charset?: string };
					Body: { Html: { Data: string; Charset?: string } };
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
		for (let i = 0; i < jobs.length; i++) {
			const job = jobs[i];
			if (!job) continue;
			results.push(await this.sendEmail(job));
			if (i < jobs.length - 1 && jobs.length > 1) {
				await new Promise((r) => setTimeout(r, 100));
			}
		}
		return results;
	}
}
