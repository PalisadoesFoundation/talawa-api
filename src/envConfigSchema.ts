import ajvFormats from "ajv-formats";
import type { EnvSchemaOpt } from "env-schema";
import { type Static, Type } from "typebox";

/**
 * JSON schema of a record of environment variables accessible to the talawa api at runtime.
 */
export const envConfigSchema = Type.Object({
	/**
	 * The frontend URL allowed for CORS.
	 */
	FRONTEND_URL: Type.String({
		minLength: 1,
		format: "uri",
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
	 * Password of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_PASSWORD: Type.String({
		minLength: 1,
	}),
	/**
	 * Base url that is exposed to the clients for making requests to the talawa api server at runtime.
	 */
	API_BASE_URL: Type.String({
		minLength: 1,
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
	 * URL to the facebook account of the community.
	 */
	API_COMMUNITY_FACEBOOK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the github account of the community.
	 */
	API_COMMUNITY_GITHUB_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: Type.Optional(
		Type.Integer({
			minimum: 1,
		}),
	),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INSTAGRAM_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the linkedin account of the community.
	 */
	API_COMMUNITY_LINKEDIN_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Name of the community.
	 */
	API_COMMUNITY_NAME: Type.String({
		minLength: 1,
	}),
	/**
	 * URL to the reddit account of the community.
	 */
	API_COMMUNITY_REDDIT_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the slack account of the community.
	 */
	API_COMMUNITY_SLACK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the website of the community.
	 */
	API_COMMUNITY_WEBSITE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the x account of the community.
	 */
	API_COMMUNITY_X_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
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
	 * URL to the youtube account of the community.
	 */
	API_COMMUNITY_YOUTUBE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Used for providing the host of the domain on which talawa api will run.
	 */
	API_HOST: Type.String({
		minLength: 1,
	}),
	/**
	 * Used for providing the decision for whether to apply the sql migrations generated by drizzle-kit to the postgres database at the startup of talawa api.
	 */
	API_IS_APPLY_DRIZZLE_MIGRATIONS: Type.Boolean(),
	/**
	 * Used for providing the decision for whether to enable graphiql web client. It is useful to enable the graphiql web client in development environments for easier graphql schema exploration.
	 */
	API_IS_GRAPHIQL: Type.Boolean(),
	/**
	 * Used for providing the decision for whether to enable pretty logging with pino.js logger. It is useful to enable prettier logging in development environments for easier developer log comprehension.
	 */
	API_IS_PINO_PRETTY: Type.Boolean(),
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
	 * Sampling ratio for OpenTelemetry traces.
	 * Value between 0 (no traces) and 1 (all traces).
	 * Default: 1 (sample all traces)
	 */
	API_OTEL_SAMPLING_RATIO: Type.Optional(
		Type.Number({
			minimum: 0,
			maximum: 1,
			default: 1,
		}),
	),
	/**
	 * The threshold in milliseconds for a request to be considered slow.
	 */
	API_SLOW_REQUEST_MS: Type.Optional(
		Type.Number({
			minimum: 0,
			default: 500,
		}),
	),
	/**
	 * Enabled state for OpenTelemetry tracing.
	 */
	API_OTEL_ENABLED: Type.Boolean({
		default: false,
		description: "Enable or disable OpenTelemetry tracing",
	}),
	/**
	 * Environment name for OpenTelemetry (e.g. 'production', 'development').
	 */
	API_OTEL_ENVIRONMENT: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * OTLP Exporter Endpoint URL.
	 */
	API_OTEL_EXPORTER_OTLP_ENDPOINT: Type.Optional(
		Type.String({
			minLength: 1,
			format: "uri", // Using format: uri for validation
		}),
	),
	/**
	 * Service name for OpenTelemetry.
	 */
	API_OTEL_SERVICE_NAME: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * Used for providing the log level for the logger used in talawa api.
	 *
	 * @privateRemarks
	 * Log levels should only be changed when the developers know what they're doing. Otherwise the default log level of `info` should be used.
	 */
	API_LOG_LEVEL: Type.Enum({
		debug: "debug",
		error: "error",
		fatal: "fatal",
		info: "info",
		trace: "trace",
		warn: "warn",
	}),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	MINIO_ROOT_USER: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_ACCESS_KEY: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_END_POINT: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_PORT: Type.Number(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_SECRET_KEY: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_USE_SSL: Type.Optional(Type.Boolean()),
	API_MINIO_PUBLIC_BASE_URL: Type.Optional(Type.String()),
	/**
	 * Used for providing the port of the domain on which the server will run.
	 */
	API_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-DBNAME}
	 */
	API_POSTGRES_DATABASE: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST}
	 */
	API_POSTGRES_HOST: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PASSWORD}
	 */
	API_POSTGRES_PASSWORD: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PORT}
	 */
	API_POSTGRES_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE}
	 */
	API_POSTGRES_SSL_MODE: Type.Union([
		Type.Enum({
			allow: "allow",
			prefer: "prefer",
			require: "require",
			verify_full: "verify-full",
		}),
		Type.Boolean(),
	]),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-USER}
	 */
	API_POSTGRES_USER: Type.String(),
	API_REDIS_HOST: Type.String({
		minLength: 1,
	}),
	API_REDIS_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * Optional JSON object to override default cache TTL values per entity type.
	 *
	 * **Format**: JSON object with entity keys and TTL values in seconds.
	 *
	 * **Valid keys**: `user`, `organization`, `event`, `post`
	 *
	 * **Example**: `'{"user": 600, "organization": 600, "event": 240, "post": 120}'`
	 *
	 * **Error Handling**:
	 * - If the JSON is malformed, the entire value is ignored and default TTLs are used.
	 *   A warning is logged via `console.warn` in `src/services/caching/cacheConfig.ts`.
	 * - Unknown keys are silently ignored (no warning).
	 * - Non-numeric or non-positive values for valid keys are ignored with a warning log.
	 *
	 * **Defaults** (defined in `src/services/caching/cacheConfig.ts`):
	 * - `user`: 300 seconds (5 minutes)
	 * - `organization`: 300 seconds (5 minutes)
	 * - `event`: 120 seconds (2 minutes)
	 * - `post`: 60 seconds (1 minute)
	 *
	 * @see src/services/caching/cacheConfig.ts for TTL parsing logic and defaults.
	 */
	CACHE_ENTITY_TTLS: Type.Optional(
		Type.String({
			minLength: 2, // Minimum valid JSON: "{}"
			format: "json", // Validates JSON syntax at schema-time
		}),
	),
	// API_REDIS_URI: Type.String({
	// 	format: "uri",
	// 	pattern: "^redis://.*",
	// }),

	API_GRAPHQL_SCALAR_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of scalar field with resolvers
	API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of object field
	API_GRAPHQL_OBJECT_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of list field
	API_GRAPHQL_LIST_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of non-paginated list field
	API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// base cost of mutation
	API_GRAPHQL_MUTATION_BASE_COST: Type.Number({
		minimum: 0,
	}),
	// base cost of subscription
	API_GRAPHQL_SUBSCRIPTION_BASE_COST: Type.Number({
		minimum: 0,
	}),
	/**
	 * Maximum capacity of a user's request bucket for rate limiting.
	 */
	API_RATE_LIMIT_BUCKET_CAPACITY: Type.Number({
		minimum: 0,
	}),

	/**
	 * Rate at which a user's request bucket refills per second for rate limiting.
	 */
	API_RATE_LIMIT_REFILL_RATE: Type.Number({
		minimum: 0,
	}),

	/**
	 * Enables the background email queue processor. Default should be false in tests / local unless explicitly needed.
	 */
	API_ENABLE_EMAIL_QUEUE: Type.Optional(Type.Boolean()),

	/**
	 * Cron schedule for the recurring event instance generation background worker.
	 * Default: "0 * * * *" (every hour at minute 0)
	 */
	RECURRING_EVENT_GENERATION_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),

	/**
	 * Cron schedule for the old event instance cleanup background worker.
	 * Default: "0 2 * * *" (daily at 2 AM UTC)
	 */
	OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),

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

	/**
	 * Cron schedule for the metrics aggregation background worker.
	 * Default: "*\/5 * * * *" (every 5 minutes)
	 */
	API_METRICS_AGGREGATION_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),

	/**
	 * Enable or disable metrics aggregation background worker.
	 * Default: true
	 */
	API_METRICS_AGGREGATION_ENABLED: Type.Optional(
		Type.Boolean({
			default: true,
		}),
	),

	/**
	 * Maximum number of performance snapshots to retain in memory.
	 * Default: 1000
	 */
	API_METRICS_SNAPSHOT_RETENTION_COUNT: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 1000,
		}),
	),

	/**
	 * Time window in minutes for metrics aggregation.
	 * Only snapshots within this window will be included in aggregation.
	 * Default: 5
	 */
	API_METRICS_AGGREGATION_WINDOW_MINUTES: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 5,
		}),
	),

	/**
	 * API key for authenticating requests to the /metrics/perf endpoint.
	 * If not set, the endpoint is unprotected (suitable for development).
	 * In production, set this to a secure random string.
	 */
	API_METRICS_API_KEY: Type.Optional(
		Type.String({
			minLength: 32,
		}),
	),

	/**
	 * Master switch to enable or disable metrics collection and aggregation.
	 * When disabled, metrics collection is skipped entirely.
	 * Default: true
	 */
	API_METRICS_ENABLED: Type.Optional(
		Type.Boolean({
			default: true,
		}),
	),

	/**
	 * Threshold in milliseconds for considering an operation as slow.
	 * Operations exceeding this threshold will be tracked in slow operations metrics.
	 * Default: 200
	 */
	API_METRICS_SLOW_OPERATION_MS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 200,
		}),
	),

	/**
	 * Threshold in milliseconds for considering a request as slow.
	 * Requests exceeding this threshold will be logged as warnings.
	 * Default: 500
	 */
	API_METRICS_SLOW_REQUEST_MS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 500,
		}),
	),

	/**
	 * Time-to-live in seconds for cached aggregated metrics.
	 * Determines how long metrics remain in cache before expiration.
	 * Default: 300 (5 minutes)
	 */
	API_METRICS_CACHE_TTL_SECONDS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 300,
		}),
	),
});

/**
 * Type of the object containing parsed configuration environment variables.
 */
export type EnvConfig = Static<typeof envConfigSchema>;

/**
 * The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
 */
export const envSchemaAjv: EnvSchemaOpt["ajv"] = {
	customOptions: (ajvInstance) => {
		ajvFormats.default(ajvInstance, {
			formats: ["email", "uri"],
		});

		// Custom "json" format validator for fail-fast JSON object validation
		// Only accepts non-null objects (not arrays or primitives)
		ajvInstance.addFormat("json", {
			type: "string",
			validate: (value: string): boolean => {
				try {
					const parsed = JSON.parse(value);
					return (
						parsed !== null &&
						typeof parsed === "object" &&
						!Array.isArray(parsed)
					);
				} catch {
					return false;
				}
			},
		});

		return ajvInstance;
	},
};
