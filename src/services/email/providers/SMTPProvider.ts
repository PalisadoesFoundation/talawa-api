import type {
	EmailJob,
	EmailResult,
	IEmailProvider,
	NonEmptyString,
} from "../types";

/**
 * Configuration for SMTP Email Provider.
 */
export interface SMTPProviderConfig {
	/** SMTP server hostname. Required. */
	host: NonEmptyString;
	/** SMTP server port. Required. */
	port: number;
	/** SMTP username for authentication. Optional. */
	user?: string;
	/** SMTP password for authentication. Optional. */
	password?: string;
	/** Whether to use SSL/TLS (true for port 465, false for port 587 with STARTTLS). */
	secure?: boolean;
	/** Default sender email address. */
	fromEmail?: string;
	/** Default sender display name. */
	fromName?: string;
}

// TODO: Consider batching/parallelizing sendBulkEmails for performance in future updates.
// This would improve throughput for high-volume scenarios.
/**
 * SMTP implementation of IEmailProvider using Nodemailer.
 *
 * This provider uses nodemailer to send emails via SMTP.
 * It lazily initializes the transporter on first use.
 */
export class SMTPProvider implements IEmailProvider {
	private config: SMTPProviderConfig;
	private transporter: {
		sendMail: (options: unknown) => Promise<{ messageId?: string }>;
	} | null = null;

	/**
	 * Creates an instance of SMTPProvider.
	 * @param config - The SMTP configuration object containing host, port, and credentials.
	 */
	constructor(config: SMTPProviderConfig) {
		this.config = config;
	}

	private async getTransporter(): Promise<{
		sendMail: (options: unknown) => Promise<{ messageId?: string }>;
	}> {
		if (!this.transporter) {
			const nodemailer = await import("nodemailer");

			// Validate host
			if (!this.config.host) {
				throw new Error("SMTP_HOST must be a non-empty string");
			}

			// Validate port
			if (!this.config.port) {
				throw new Error("SMTP_PORT must be provided");
			}

			// Validate port is a finite integer in the range 1-65535
			if (
				!Number.isInteger(this.config.port) ||
				!Number.isFinite(this.config.port) ||
				this.config.port < 1 ||
				this.config.port > 65535
			) {
				throw new Error("SMTP_PORT must be an integer between 1 and 65535");
			}

			// Validate that either both user and password are provided or neither
			const hasUser = Boolean(this.config.user);
			const hasPassword = Boolean(this.config.password);
			if (hasUser !== hasPassword) {
				throw new Error(
					"Both user and password must be provided together, or neither should be set",
				);
			}

			this.transporter = nodemailer.createTransport({
				host: this.config.host,
				port: this.config.port,
				secure: this.config.secure ?? false,
				auth:
					this.config.user && this.config.password
						? {
								user: this.config.user,
								pass: this.config.password,
							}
						: undefined,
			}) as {
				sendMail: (options: unknown) => Promise<{ messageId?: string }>;
			};
		}
		return this.transporter;
	}

	/**
	 * Sanitize string by removing CR and LF characters to prevent SMTP header injection
	 */
	private sanitizeHeader(value: string | undefined): string {
		if (!value) return "";
		return value.replace(/[\r\n]/g, " ");
	}

	/**
	 * Send a single email using the configured SMTP server
	 */
	async sendEmail(job: EmailJob): Promise<EmailResult> {
		try {
			if (!this.config.fromEmail) {
				throw new Error(
					"Email service not configured. Please set SMTP_FROM_EMAIL (and optionally SMTP_FROM_NAME) or run 'npm run setup' to configure SMTP.",
				);
			}

			const transporter = await this.getTransporter();

			// Sanitize fromName and subject to prevent SMTP header injection
			const safeFromName = this.sanitizeHeader(this.config.fromName);
			const safeSubject = this.sanitizeHeader(job.subject);

			const fromAddress = safeFromName
				? `${safeFromName} <${this.config.fromEmail}>`
				: this.config.fromEmail;

			const mailOptions = {
				from: fromAddress,
				to: job.email,
				subject: safeSubject,
				html: job.htmlBody,
				...(job.textBody ? { text: job.textBody } : {}),
			};

			const response = await transporter.sendMail(mailOptions);
			return { id: job.id, success: true, messageId: response.messageId };
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
				// Rate limiting delay to avoid SMTP throttling
				await new Promise((r) => setTimeout(r, 100));
			}
		}
		return results;
	}
}
