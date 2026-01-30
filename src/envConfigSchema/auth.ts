import { Type } from "typebox";

export const authConfigSchema = Type.Object({
	/**
	 * Password of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_PASSWORD: Type.String({
		minLength: 1,
	}),
	/**
	 * Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_EMAIL_ADDRESS: Type.String({
		format: "email",
	}),
	/**
	 * Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_NAME: Type.String({
		minLength: 1,
		maxLength: 256,
	}),
	/**
	 * Duration in milliseconds for which an account remains locked after exceeding failed login threshold.
	 * Default: 900000 (15 minutes)
	 */
	API_ACCOUNT_LOCKOUT_DURATION_MS: Type.Optional(
		Type.Integer({
			minimum: 1000,
			default: 900000,
		}),
	),
	/**
	 * Maximum number of failed login attempts before account lockout.
	 * Default: 5
	 */
	API_ACCOUNT_LOCKOUT_THRESHOLD: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 5,
		}),
	),
	/**
	 * Used for providing the number of milli-seconds for setting the expiry time of authentication json web tokens created by talawa api.
	 */
	API_JWT_EXPIRES_IN: Type.Number({
		minimum: 0,
	}),
	/**
	 * Used for providing the number of milli-seconds for setting the expiry time of refresh tokens created by talawa api.
	 * Refresh tokens are long-lived tokens used to obtain new access tokens without re-authentication.
	 * Default: 604800000 (7 days)
	 */
	API_REFRESH_TOKEN_EXPIRES_IN: Type.Number({
		minimum: 0,
		default: 604800000,
	}),
	/**
	 * Password reset token expiry for User Portal in seconds.
	 * Set to 0 for no timeout (tokens never expire).
	 * Default: 1209600 (14 days, similar to Gmail)
	 */
	API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS: Type.Optional(
		Type.Integer({
			minimum: 0,
			default: 1209600,
		}),
	),
	/**
	 * Password reset token expiry for Admin Portal in seconds.
	 * Set to 0 for no timeout (tokens never expire).
	 * Default: 3600 (1 hour, similar to Google Admin Console)
	 */
	API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS: Type.Optional(
		Type.Integer({
			minimum: 0,
			default: 3600,
		}),
	),
	/**
	 * HMAC secret key for hashing password reset tokens.
	 * Used for defense-in-depth; tokens already have 256 bits of entropy.
	 * Should be at least 32 characters for security best practices.
	 * Defaults to a static value if not provided (upgrade to custom secret is recommended).
	 */
	API_PASSWORD_RESET_TOKEN_HMAC_SECRET: Type.Optional(
		Type.String({
			minLength: 32,
			default: "talawa-password-reset-token-hmac-default-secret-key",
		}),
	),
	/**
	 * Used for providing the secret for signing and verifying authentication json web tokens created by talawa api.
	 */
	API_JWT_SECRET: Type.String({
		minLength: 64,
	}),
	/**
	 * Secret used for signing cookies. Should be a random string of at least 32 characters.
	 * Used by @fastify/cookie for cookie signing and verification.
	 */
	API_COOKIE_SECRET: Type.String({
		minLength: 32,
	}),
	/**
	 * Optional domain for authentication cookies.
	 * Set this for cross-subdomain authentication (e.g., ".talawa.io" for sharing cookies between admin.talawa.io and api.talawa.io).
	 * Must be a valid domain starting with a dot for subdomain sharing, or a valid hostname.
	 */
	API_COOKIE_DOMAIN: Type.Optional(
		Type.String({
			minLength: 1,
			pattern:
				"^(\\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\\.[a-zA-Z]{2,})+|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*)$",
		}),
	),
	/**
	 * Whether to use secure cookies (HTTPS only).
	 * Defaults to true in production environments. Set explicitly for testing.
	 */
	API_IS_SECURE_COOKIES: Type.Optional(Type.Boolean()),
	/**
	 * Secret key for Google reCAPTCHA v2 verification.
	 * Used to verify reCAPTCHA tokens on the server side.
	 */
	RECAPTCHA_SECRET_KEY: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Google OAuth Client ID for authentication.
	 */
	GOOGLE_CLIENT_ID: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Google OAuth Client Secret for authentication.
	 */
	GOOGLE_CLIENT_SECRET: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Google OAuth Redirect URI for authentication callback.
	 */
	GOOGLE_REDIRECT_URI: Type.Optional(
		Type.String({
			minLength: 1,
			format: "uri",
		}),
	),
	/**
	 * GitHub OAuth Client ID for authentication.
	 */
	GITHUB_CLIENT_ID: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * GitHub OAuth Client Secret for authentication.
	 */
	GITHUB_CLIENT_SECRET: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * GitHub OAuth Redirect URI for authentication callback.
	 */
	GITHUB_REDIRECT_URI: Type.Optional(
		Type.String({
			minLength: 1,
			format: "uri",
		}),
	),
	/**
	 * Request timeout in milliseconds for OAuth provider API calls.
	 * Default: 10000 (10 seconds)
	 */
	API_OAUTH_REQUEST_TIMEOUT_MS: Type.Optional(
		Type.Integer({
			minimum: 1000,
			maximum: 60000,
			default: 10000,
		}),
	),
});
