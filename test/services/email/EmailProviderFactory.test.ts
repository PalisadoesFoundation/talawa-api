import { describe, expect, it } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import { EmailProviderFactory } from "~/src/services/email/EmailProviderFactory";
import { SESProvider } from "~/src/services/email/providers/SESProvider";

describe("EmailProviderFactory", () => {
	it("should return SESProvider when API_EMAIL_PROVIDER is 'ses'", () => {
		const config = {
			API_EMAIL_PROVIDER: "ses",
			AWS_SES_REGION: "us-east-1",
			AWS_ACCESS_KEY_ID: "key",
			AWS_SECRET_ACCESS_KEY: "secret",
			AWS_SES_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SESProvider);
	});

	it("should throw error when AWS_SES_REGION is missing for SES provider", () => {
		const config = {
			API_EMAIL_PROVIDER: "ses",
			// AWS_SES_REGION missing
			AWS_ACCESS_KEY_ID: "key",
			AWS_SECRET_ACCESS_KEY: "secret",
			AWS_SES_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		expect(() => EmailProviderFactory.create(config)).toThrow(
			"AWS_SES_REGION is required when using SES provider",
		);
	});

	it("should throw error for unsupported provider", () => {
		const config = {
			API_EMAIL_PROVIDER: "unknown",
		} as unknown as EnvConfig;

		expect(() => EmailProviderFactory.create(config)).toThrow(
			"Unsupported email provider: unknown",
		);
	});

	it("should throw error when 'smtp' is selected but not implemented (or if handled in factory)", () => {
		// Assuming we didn't implement SMTPProvider yet, relying on the factory either handling it or throwing default
		const config = {
			API_EMAIL_PROVIDER: "smtp",
		} as unknown as EnvConfig;

		// Following current implementation it should throw "Unsupported email provider: smtp"
		expect(() => EmailProviderFactory.create(config)).toThrow(
			"Unsupported email provider: smtp",
		);
	});
	it("should return SESProvider when credentials are omitted (IAM role scenario)", () => {
		const config = {
			API_EMAIL_PROVIDER: "ses",
			AWS_SES_REGION: "us-east-1",
			// AWS_ACCESS_KEY_ID omitted
			// AWS_SECRET_ACCESS_KEY omitted
			AWS_SES_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SESProvider);
	});

	it("should return SESProvider when AWS_SES_FROM_NAME is omitted", () => {
		const config = {
			API_EMAIL_PROVIDER: "ses",
			AWS_SES_REGION: "us-east-1",
			AWS_ACCESS_KEY_ID: "key",
			AWS_SECRET_ACCESS_KEY: "secret",
			AWS_SES_FROM_EMAIL: "from@example.com",
			// AWS_SES_FROM_NAME omitted
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SESProvider);
	});
});
