import { Type } from "typebox";

export const emailConfigSchema = Type.Object({
	/**
	 * Email provider selection.
	 * Supported values: 'ses' (Amazon SES) and 'smtp'.
	 * Defaults to 'ses' if not specified.
	 */
	API_EMAIL_PROVIDER: Type.Optional(
		Type.Union([Type.Literal("ses"), Type.Literal("smtp")], { default: "ses" }),
	),
	/**
	 * AWS access key ID for SES email service.
	 */
	AWS_ACCESS_KEY_ID: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * AWS secret access key for SES email service.
	 */
	AWS_SECRET_ACCESS_KEY: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * AWS region for SES email service.
	 */
	AWS_SES_REGION: Type.Optional(
		Type.String({
			minLength: 1,
			default: "ap-south-1",
		}),
	),
	/**
	 * Verified email address to send emails from in AWS SES.
	 */
	AWS_SES_FROM_EMAIL: Type.Optional(
		Type.String({
			format: "email",
		}),
	),
	/**
	 * Display name for the sender in emails.
	 */
	AWS_SES_FROM_NAME: Type.Optional(
		Type.String({
			minLength: 1,
			default: "Talawa",
		}),
	),
	/**
	 * SMTP server hostname for email service.
	 */
	SMTP_HOST: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * SMTP server port for email service.
	 * Common values: 587 (TLS), 465 (SSL), 25 (unsecured)
	 */
	SMTP_PORT: Type.Optional(Type.Integer({ minimum: 1, maximum: 65535 })),
	/**
	 * SMTP username for authentication.
	 */
	SMTP_USER: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * SMTP password for authentication.
	 */
	SMTP_PASSWORD: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * Whether to use SSL/TLS for SMTP connection.
	 * Set to true for port 465, false for port 587 with STARTTLS.
	 */
	SMTP_SECURE: Type.Optional(Type.Boolean()),
	/**
	 * Verified email address to send emails from via SMTP.
	 */
	SMTP_FROM_EMAIL: Type.Optional(
		Type.String({
			format: "email",
		}),
	),
	/**
	 * Display name for the sender in emails via SMTP.
	 */
	SMTP_FROM_NAME: Type.Optional(
		Type.String({
			minLength: 1,
			default: "Talawa",
		}),
	),
	/**
	 * Client hostname to greet the SMTP server with.
	 * Default: machine hostname
	 */
	SMTP_NAME: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * Local IP address to bind to for outgoing SMTP connections.
	 */
	SMTP_LOCAL_ADDRESS: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * Enables the background email queue processor. Default should be false in tests / local unless explicitly needed.
	 */
	API_ENABLE_EMAIL_QUEUE: Type.Optional(Type.Boolean()),
	/**
	 * Email verification token expiry in seconds.
	 * Default: 86400 (24 hours)
	 */
	API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 86400,
		}),
	),
	/**
	 * HMAC secret key for hashing email verification tokens.
	 * Used for defense-in-depth; tokens already have 256 bits of entropy.
	 * Should be at least 32 characters for security best practices.
	 * Defaults to a static value if not provided (upgrade to custom secret is recommended).
	 */
	API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET: Type.Optional(
		Type.String({
			minLength: 32,
			default: "talawa-email-verification-token-hmac-default-secret-key",
		}),
	),
});
