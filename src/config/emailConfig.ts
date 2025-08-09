import type { EmailConfig } from "~/src/services/EmailService";

/**
 * Email configuration from environment variables
 */
export const emailConfig: EmailConfig = {
	region: process.env.AWS_SES_REGION || "ap-south-1",
	fromEmail: process.env.AWS_SES_FROM_EMAIL || "mail@mbxd.xyz",
	fromName: process.env.AWS_SES_FROM_NAME || "Talawa",
};
