import { emailConfig } from "~/src/config/emailConfig";
import type { GraphQLContext } from "~/src/graphql/context";
import { EmailQueueProcessor } from "~/src/services/EmailQueueProcessor";
import { EmailService } from "~/src/services/EmailService";

// Global email service instance
export const emailService = new EmailService(emailConfig);

// Global email queue processor instance
let emailQueueProcessor: EmailQueueProcessor | null = null;

/**
 * Initialize email queue processor
 */
export function initializeEmailQueue(ctx: GraphQLContext): void {
	if (!emailQueueProcessor) {
		emailQueueProcessor = new EmailQueueProcessor(emailService, ctx);
		emailQueueProcessor.startBackgroundProcessing();
		ctx.log.info("Email queue processor initialized");
	}
}

/**
 * Get email queue processor instance
 */
export function getEmailQueueProcessor(): EmailQueueProcessor | null {
	return emailQueueProcessor;
}
