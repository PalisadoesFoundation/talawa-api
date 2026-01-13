import { describe, expect, it } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import { EmailProviderFactory } from "~/src/services/email/EmailProviderFactory";
import { SESProvider } from "~/src/services/email/providers/SESProvider";
import { SMTPProvider } from "~/src/services/email/providers/SMTPProvider";

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

	it("should throw error when SMTP provider is selected but SMTP_HOST is missing", () => {
		// SMTP is now implemented
		const config = {
			API_EMAIL_PROVIDER: "smtp",
		} as unknown as EnvConfig;

		// Should throw error for missing SMTP_HOST
		expect(() => EmailProviderFactory.create(config)).toThrow(
			"SMTP_HOST is required when using SMTP provider",
		);
	});

	it("should return SMTPProvider when API_EMAIL_PROVIDER is 'smtp'", () => {
		const config = {
			API_EMAIL_PROVIDER: "smtp",
			SMTP_HOST: "smtp.example.com",
			SMTP_PORT: 587,
			SMTP_USER: "user@example.com",
			SMTP_PASSWORD: "password",
			SMTP_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SMTPProvider);
	});

	it("should throw error when SMTP_PORT is missing for SMTP provider", () => {
		const config = {
			API_EMAIL_PROVIDER: "smtp",
			SMTP_HOST: "smtp.example.com",
			// SMTP_PORT missing
			SMTP_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		expect(() => EmailProviderFactory.create(config)).toThrow(
			"SMTP_PORT is required when using SMTP provider",
		);
	});

	it("should return SMTPProvider when authentication is omitted", () => {
		const config = {
			API_EMAIL_PROVIDER: "smtp",
			SMTP_HOST: "smtp.example.com",
			SMTP_PORT: 587,
			// SMTP_USER omitted
			// SMTP_PASSWORD omitted
			SMTP_FROM_EMAIL: "from@example.com",
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SMTPProvider);
	});

	it("should return SMTPProvider when SMTP_FROM_NAME is omitted", () => {
		const config = {
			API_EMAIL_PROVIDER: "smtp",
			SMTP_HOST: "smtp.example.com",
			SMTP_PORT: 587,
			SMTP_USER: "user@example.com",
			SMTP_PASSWORD: "password",
			SMTP_FROM_EMAIL: "from@example.com",
			// SMTP_FROM_NAME omitted
		} as unknown as EnvConfig;

		const provider = EmailProviderFactory.create(config);
		expect(provider).toBeInstanceOf(SMTPProvider);
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
