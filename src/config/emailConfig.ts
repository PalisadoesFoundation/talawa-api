import type { EmailConfig } from "~/src/services/ses/EmailService";

/**
 * Email configuration from environment variables
 */
export const emailConfig: EmailConfig = {
	region: process.env.AWS_SES_REGION || "ap-south-1",
	fromEmail: process.env.AWS_SES_FROM_EMAIL as string,
	fromName: process.env.AWS_SES_FROM_NAME || "Talawa",
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
