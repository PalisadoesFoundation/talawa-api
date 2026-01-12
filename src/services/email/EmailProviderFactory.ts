import type { EmailEnvConfig } from "../../config/emailConfig";
import { SESProvider } from "./providers/SESProvider";
import type { IEmailProvider, NonEmptyString } from "./types";

export const EmailProviderFactory = {
	/**
	 * Creates an email provider instance based on configuration.
	 * @param config - Email environment configuration
	 * @returns Email provider instance implementing IEmailProvider
	 * @throws Error if AWS_SES_REGION is missing for SES provider
	 * @throws Error if provider type is unsupported
	 */
	create(config: EmailEnvConfig): IEmailProvider {
		switch (config.API_EMAIL_PROVIDER) {
			case "ses": {
				const region = config.AWS_SES_REGION;
				if (!region) {
					throw new Error("AWS_SES_REGION is required when using SES provider");
				}
				return new SESProvider({
					region: region as NonEmptyString,
					accessKeyId: config.AWS_ACCESS_KEY_ID,
					secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
					fromEmail: config.AWS_SES_FROM_EMAIL,
					fromName: config.AWS_SES_FROM_NAME,
				});
			}
			default:
				// Throw for unsupported email providers
				throw new Error(
					`Unsupported email provider: ${config.API_EMAIL_PROVIDER}`,
				);
		}
	},
};
