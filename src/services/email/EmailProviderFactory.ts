import type { EmailEnvConfig } from "../../config/emailConfig";
import { ErrorCode } from "../../utilities/errors/errorCodes";
import { TalawaRestError } from "../../utilities/errors/TalawaRestError";
import { SESProvider } from "./providers/SESProvider";
import { SMTPProvider } from "./providers/SMTPProvider";
import type { IEmailProvider, NonEmptyString } from "./types";

export const EmailProviderFactory = {
	/**
	 * Creates an email provider instance based on configuration.
	 * @param config - Email environment configuration
	 * @returns Email provider instance implementing IEmailProvider
	 * @throws Error if API_AWS_SES_REGION is missing for SES provider
	 * @throws Error if API_SMTP_HOST is missing for SMTP provider
	 * @throws Error if API_SMTP_PORT is missing for SMTP provider
	 * @throws Error if provider type is unsupported
	 * @remarks
	 * For SMTP provider, optional fields (SMTP_USER, SMTP_PASSWORD, SMTP_SECURE,
	 * API_SMTP_FROM_EMAIL, API_SMTP_FROM_NAME) are passed through to SMTPProvider.
	 * For SES provider, optional fields (API_AWS_ACCESS_KEY_ID, API_AWS_SECRET_ACCESS_KEY,
	 * API_AWS_SES_FROM_NAME) are passed through to SESProvider.
	 * Mailpit is used for local email testing by default.
	 */
	create(config: EmailEnvConfig): IEmailProvider {
		switch (config.API_EMAIL_PROVIDER) {
			case "ses": {
				const region = config.API_AWS_SES_REGION;
				if (!region) {
					throw new TalawaRestError({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "API_AWS_SES_REGION is required when using SES provider",
					});
				}
				return new SESProvider({
					region: region as NonEmptyString,
					accessKeyId: config.API_AWS_ACCESS_KEY_ID,
					secretAccessKey: config.API_AWS_SECRET_ACCESS_KEY,
					fromEmail: config.API_AWS_SES_FROM_EMAIL,
					fromName: config.API_AWS_SES_FROM_NAME,
				});
			}
			case "smtp": {
				const host = config.API_SMTP_HOST;
				const port = config.API_SMTP_PORT;
				if (!host) {
					throw new TalawaRestError({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "API_SMTP_HOST is required when using SMTP provider",
					});
				}
				if (!port) {
					throw new TalawaRestError({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "API_SMTP_PORT is required when using SMTP provider",
					});
				}
				return new SMTPProvider({
					host: host as NonEmptyString,
					port,
					user: config.SMTP_USER,
					password: config.SMTP_PASSWORD,
					secure: config.SMTP_SECURE,
					fromEmail: config.API_SMTP_FROM_EMAIL,
					fromName: config.API_SMTP_FROM_NAME,
					name: config.SMTP_NAME,
					localAddress: config.SMTP_LOCAL_ADDRESS,
				});
			}
			case "mailpit": {
				const mailpitHost = config.API_SMTP_HOST || "mailpit";
				const mailpitPort = config.API_SMTP_PORT || 1025;
				return new SMTPProvider({
					host: mailpitHost as NonEmptyString,
					port: mailpitPort,
					user: undefined,
					password: undefined,
					secure: false,
					fromEmail: config.API_SMTP_FROM_EMAIL || "test@talawa.local",
					fromName: config.API_SMTP_FROM_NAME || "Talawa",
					name: undefined,
					localAddress: undefined,
				});
			}
			default:
				// Throw for unsupported email providers
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: `Unsupported email provider: ${config.API_EMAIL_PROVIDER}`,
				});
		}
	},
};
