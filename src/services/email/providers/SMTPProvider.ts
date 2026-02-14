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
	/** Client hostname to greet the SMTP server with. */
	name?: string;
	/** Local IP address to bind to for outgoing SMTP connections. */
	localAddress?: string;
}

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

	/**
	 * Returns the SMTP configuration for testing purposes.
	 * @returns The SMTP configuration object.
	 */
	getConfig(): SMTPProviderConfig {
		return { ...this.config };
	}

	private async getTransporter(): Promise<{
		sendMail: (options: unknown) => Promise<{ messageId?: string }>;
	}> {
		if (!this.transporter) {
			// Normalize the namespace to handle ESM/CommonJS interop
			const ns = await import("nodemailer");
			const nodemailer = ns.default ?? ns;

			// Validate host
			if (!this.config.host) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "API_SMTP_HOST must be a non-empty string",
				});
			}

			// Validate port
			if (!this.config.port) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "API_SMTP_PORT must be provided",
				});
			}

			// Validate port is a finite integer in the range 1-65535
			if (
				!Number.isInteger(this.config.port) ||
				this.config.port < 1 ||
				this.config.port > 65535
			) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "API_SMTP_PORT must be an integer between 1 and 65535",
				});
			}

			// Validate that either both user and password are provided or neither
			const hasUser = Boolean(this.config.user);
			const hasPassword = Boolean(this.config.password);
			if (hasUser !== hasPassword) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message:
						"Both user and password must be provided together, or neither should be set",
				});
			}

			this.transporter = nodemailer.createTransport({
				host: this.config.host,
				port: this.config.port,
				secure: this.config.secure ?? false,
				name: this.config.name,
				localAddress: this.config.localAddress,
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
		if (!this.config.fromEmail) {
			throw new TalawaRestError({
				code: ErrorCode.INVALID_ARGUMENTS,
				message:
					"Email service not configured. Please set API_SMTP_FROM_EMAIL (and optionally API_SMTP_FROM_NAME) or run 'npm run setup' to configure SMTP.",
			});
		}

		try {
			const transporter = await this.getTransporter();

			// Sanitize all header fields to prevent SMTP header injection
			const safeTo = this.sanitizeHeader(job.email);
			const safeFromEmail = this.sanitizeHeader(this.config.fromEmail);
			const safeFromName = this.sanitizeHeader(this.config.fromName);
			const safeSubject = this.sanitizeHeader(job.subject);

			// Validate that the recipient email is not empty/invalid
			// We explicitly check for CR/LF in the original input to prevent injection
			if (!safeTo || !safeTo.trim() || /[\r\n]/.test(job.email)) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message:
						"Recipient email is invalid or contains forbidden characters (CR/LF)",
				});
			}

			// Validate that the sender email is not empty/invalid after sanitization
			if (!safeFromEmail) {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message:
						"API_SMTP_FROM_EMAIL is invalid or contains forbidden characters (CR/LF)",
				});
			}

			const fromAddress = safeFromName
				? `${safeFromName} <${safeFromEmail}>`
				: safeFromEmail;

			const mailOptions = {
				from: fromAddress,
				to: safeTo,
				subject: safeSubject,
				html: job.htmlBody,
				...(job.textBody ? { text: job.textBody } : {}),
			};

			const response = await transporter.sendMail(mailOptions);
			return { id: job.id, success: true, messageId: response.messageId };
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			rootLogger.error(
				{
					error: errorMessage,
					stack: error instanceof Error ? error.stack : undefined,
					jobId: job.id,
				},
				"Failed to send email via SMTP",
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

			// 2. Map the batch to an array of Promises
			const batchPromises = batch.map((job) => this.sendEmail(job));

			// 3. Execute concurrently with Promise.allSettled
			const batchSettledResults = await Promise.allSettled(batchPromises);

			// 4. Extract the results
			for (let j = 0; j < batchSettledResults.length; j++) {
				const settled = batchSettledResults[j];
				const currentJob = batch[j];

				// SAFETY CHECK: This satisfies TypeScript's strict index checking
				if (!settled || !currentJob) continue;

				if (settled.status === "fulfilled") {
					results.push(settled.value);
				} else {
					// Fallback in case a promise rejects outside of sendEmail's try/catch
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

			// 5. Apply rate limit delay between batches (skip after the last batch)
			if (i + BATCH_SIZE < jobs.length) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS),
				);
			}
		}

		return results;
	}
}
