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

	constructor(config: EmailConfig) {
		this.config = config;
	}

	/**
	 * Send a single email using AWS SES
	 */
	async sendEmail(job: EmailJob): Promise<EmailResult> {
		try {
			// Import AWS SDK dynamically to avoid loading if not needed
			const { SESClient, SendEmailCommand } = await import(
				"@aws-sdk/client-ses"
			);

			// Create SES client with default credentials
			const sesClient = new SESClient({
				region: this.config.region,
			});

			// Prepare email command
			const fromAddress = this.config.fromName
				? `${this.config.fromName} <${this.config.fromEmail}>`
				: this.config.fromEmail;

			const command = new SendEmailCommand({
				Source: fromAddress,
				Destination: {
					ToAddresses: [job.email],
				},
				Message: {
					Subject: {
						Data: job.subject,
						Charset: "UTF-8",
					},
					Body: {
						Html: {
							Data: job.htmlBody,
							Charset: "UTF-8",
						},
					},
				},
			});

			// Send email
			const response = await sesClient.send(command);
			console.log(`Email sent: ${response}`);
			return {
				id: job.id,
				success: true,
				messageId: response.MessageId,
			};
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

		// Send emails sequentially to avoid rate limits
		for (const job of jobs) {
			const result = await this.sendEmail(job);
			results.push(result);

			// Small delay between emails to respect SES rate limits
			if (jobs.length > 1) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		return results;
	}
}
