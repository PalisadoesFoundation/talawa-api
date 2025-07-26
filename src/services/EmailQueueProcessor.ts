import { eq } from "drizzle-orm";
import { emailNotificationsTable } from "~/src/drizzle/tables/EmailNotification";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EmailJob, EmailService } from "~/src/services/EmailService";

type EmailNotification = typeof emailNotificationsTable.$inferSelect;

/**
 * Simple email queue processor that processes pending emails
 */
export class EmailQueueProcessor {
	private emailService: EmailService;
	private ctx: GraphQLContext;
	private isProcessing = false;

	constructor(emailService: EmailService, ctx: GraphQLContext) {
		this.emailService = emailService;
		this.ctx = ctx;
	}

	/**
	 * Process pending emails from the queue
	 */
	async processPendingEmails(): Promise<void> {
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;

		try {
			// Get pending emails
			const pendingEmails =
				await this.ctx.drizzleClient.query.emailNotificationsTable.findMany({
					where: (fields, operators) => operators.eq(fields.status, "pending"),
					limit: 10, // Process in small batches
					orderBy: (fields, operators) => [operators.asc(fields.createdAt)],
				});

			if (pendingEmails.length === 0) {
				return;
			}

			// Convert to email jobs
			const emailJobs: EmailJob[] = pendingEmails.map(
				(email: EmailNotification) => ({
					id: email.id,
					email: email.email,
					subject: email.subject,
					htmlBody: email.htmlBody,
					userId: email.userId,
				}),
			);

			// Send emails
			const results = await this.emailService.sendBulkEmails(emailJobs);

			// Update email statuses based on results
			for (const result of results) {
				const email = pendingEmails.find(
					(e: EmailNotification) => e.id === result.id,
				);
				if (!email) continue;

				if (result.success) {
					// Mark as sent
					await this.ctx.drizzleClient
						.update(emailNotificationsTable)
						.set({
							status: "sent",
							sesMessageId: result.messageId,
							sentAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(emailNotificationsTable.id, result.id));
				} else {
					// Handle failure
					await this.handleEmailFailure(email, result.error || "Unknown error");
				}
			}

			this.ctx.log.info(
				`Processed ${results.length} emails, ${results.filter((r) => r.success).length} successful`,
			);
		} catch (error) {
			this.ctx.log.error("Error processing email queue:", error);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Handle email failure with retry logic
	 */
	private async handleEmailFailure(
		email: EmailNotification,
		error: string,
	): Promise<void> {
		const newRetryCount = email.retryCount + 1;

		if (newRetryCount >= email.maxRetries) {
			// Max retries reached, mark as failed
			await this.ctx.drizzleClient
				.update(emailNotificationsTable)
				.set({
					status: "failed",
					errorMessage: error,
					failedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(emailNotificationsTable.id, email.id));
		} else {
			// Increment retry count and keep as pending
			await this.ctx.drizzleClient
				.update(emailNotificationsTable)
				.set({
					retryCount: newRetryCount,
					errorMessage: error,
					updatedAt: new Date(),
				})
				.where(eq(emailNotificationsTable.id, email.id));
		}
	}

	/**
	 * Start background processor - simple setInterval approach
	 */
	startBackgroundProcessing(intervalMs = 30000): void {
		setInterval(() => {
			this.processPendingEmails().catch(console.error);
		}, intervalMs);

		this.ctx.log.info(
			`Email queue processor started with ${intervalMs}ms interval`,
		);
	}
}
