import { emailConfig } from "~/src/config/emailConfig";
import type { GraphQLContext } from "~/src/graphql/context";
import { EmailQueueProcessor } from "~/src/services/ses/EmailQueueProcessor";
import { EmailService } from "~/src/services/ses/EmailService";

// Global email service instance
export const emailService = new EmailService(emailConfig);

// Global email queue processor instance
let emailQueueProcessor: EmailQueueProcessor | null = null;

/**
 * Initialize email queue processor
 */
export function initializeEmailQueue(
	ctx: Pick<GraphQLContext, "drizzleClient" | "log"> & {
		envConfig: { API_ENABLE_EMAIL_QUEUE: boolean };
	},
): void {
	if (!ctx.envConfig.API_ENABLE_EMAIL_QUEUE) {
		ctx.log.info("Email queue disabled by API_ENABLE_EMAIL_QUEUE env var");
		return;
	}
	if (!emailQueueProcessor) {
		emailQueueProcessor = new EmailQueueProcessor(emailService, ctx);
		emailQueueProcessor.startBackgroundProcessing();
		ctx.log.info("Email queue processor initialized");
	}
}

export function stopEmailQueue(log?: { info: (msg: string) => void }): void {
	if (emailQueueProcessor) {
		emailQueueProcessor.stopBackgroundProcessing();
		log?.info("Email queue processor stopped (stopEmailQueue)");
		emailQueueProcessor = null;
	}
}

/**
 * Get email queue processor instance
 */
export function getEmailQueueProcessor(): EmailQueueProcessor | null {
	return emailQueueProcessor;
}
