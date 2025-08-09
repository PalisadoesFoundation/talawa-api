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
	ctx: Pick<GraphQLContext, "drizzleClient" | "log">,
): void {
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
