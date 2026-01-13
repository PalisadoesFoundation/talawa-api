/**
 * Branded type for non-empty strings to enforce validation at the type level.
 */
export type NonEmptyString = string & { __brand: "NonEmptyString" };

/**
 * Email job interface
 */
export interface EmailJob {
	id: string;
	email: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
	userId: string | null;
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
 * Email provider interface
 */
export interface IEmailProvider {
	sendEmail(job: EmailJob): Promise<EmailResult>;
	sendBulkEmails(jobs: EmailJob[]): Promise<EmailResult[]>;
}
