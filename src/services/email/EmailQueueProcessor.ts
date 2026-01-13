import { eq } from "drizzle-orm";
import { emailNotificationsTable } from "~/src/drizzle/tables/EmailNotification";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EmailJob, IEmailProvider } from "~/src/services/email";

type EmailNotification = typeof emailNotificationsTable.$inferSelect;

/**
 * Simple email queue processor that processes pending emails
 */
export class EmailQueueProcessor {
	private emailService: IEmailProvider;
	private ctx: Pick<GraphQLContext, "drizzleClient" | "log">;
	private isProcessing = false;
	private intervalHandle: NodeJS.Timeout | null = null;

	constructor(
		emailService: IEmailProvider,
		ctx: Pick<GraphQLContext, "drizzleClient" | "log">,
	) {
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
			const pendingEmails =
				await this.ctx.drizzleClient.query.emailNotificationsTable.findMany({
					where: (fields, operators) => operators.eq(fields.status, "pending"),
					limit: 10,
					orderBy: (fields, operators) => [operators.asc(fields.createdAt)],
				});

			if (pendingEmails.length === 0) {
				return;
			}

			const emailJobs: EmailJob[] = pendingEmails.map(
				(email: EmailNotification) => ({
					id: email.id,
					email: email.email,
					subject: email.subject,
					htmlBody: email.htmlBody,
					userId: email.userId,
				}),
			);

			const results = await this.emailService.sendBulkEmails(emailJobs);

			// Log raw results to help debug SES failures
			this.ctx.log.info({ results }, "Email send results");

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
					this.ctx.log.warn(
						{ id: result.id, error: result.error },
						"Email send failed for job",
					);
					await this.handleEmailFailure(email, result.error || "Unknown error");
				}
			}

			this.ctx.log.info(
				`Processed ${results.length} emails, ${results.filter((r) => r.success).length} successful`,
			);
		} catch (error) {
			this.ctx.log.error(error, "Error processing email queue:");
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
		const newRetryCount = (email.retryCount ?? 0) + 1;

		if (newRetryCount >= email.maxRetries) {
			this.ctx.log.warn(
				{
					emailId: email.id,
					retryCount: newRetryCount,
					maxRetries: email.maxRetries,
					error,
				},
				"Marking email as failed permanently",
			);
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
			this.ctx.log.info(
				{ emailId: email.id, retryCount: newRetryCount },
				"Scheduling retry for email",
			);
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
		if (this.intervalHandle) return;
		this.intervalHandle = setInterval(() => {
			this.processPendingEmails().catch((err) => {
				this.ctx.log.error({ err }, "Email queue tick failed");
			});
		}, intervalMs);
		this.ctx.log.info(
			`Email queue processor started with ${intervalMs}ms interval`,
		);
	}

	stopBackgroundProcessing(): void {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
			this.intervalHandle = null;
			this.ctx.log.info("Email queue processor stopped");
		}
	}
}
