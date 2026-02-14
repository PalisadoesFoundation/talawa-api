[API Docs](/)

***

# Function: assertSecretsPresent()

> **assertSecretsPresent**(`envConfig`): `void`

Defined in: [src/createServer.ts:64](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/createServer.ts#L64)

Validates that critical secrets in the environment configuration are neither
empty nor set to the placeholder sentinel (`PLACEHOLDER_SENTINEL`).

This check is primarily intended to prevent accidental deployments using the
default sentinel placeholders in production templates.

## Parameters

### envConfig

The parsed environment configuration. This function checks
API-level secrets such as `API_JWT_SECRET`, `API_COOKIE_SECRET`,
`API_MINIO_SECRET_KEY`, `API_POSTGRES_PASSWORD`, and
`API_ADMINISTRATOR_USER_PASSWORD`.
Additionally, when present, it validates `process.env.MINIO_ROOT_PASSWORD` and
`process.env.POSTGRES_PASSWORD` (service-level credentials injected for the
rootless-production compose path).

#### API_ACCOUNT_LOCKOUT_DURATION_MS?

`number` = `...`

Duration in milliseconds for which an account remains locked after exceeding failed login threshold.
Default: 900000 (15 minutes)

#### API_ACCOUNT_LOCKOUT_THRESHOLD?

`number` = `...`

Maximum number of failed login attempts before account lockout.
Default: 5

#### API_ADMINISTRATOR_USER_EMAIL_ADDRESS

`string` = `...`

Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.

#### API_ADMINISTRATOR_USER_NAME

`string` = `...`

Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.

#### API_ADMINISTRATOR_USER_PASSWORD

`string` = `...`

Password of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.

#### API_AWS_ACCESS_KEY_ID?

`string` = `...`

AWS access key ID for SES email service.

#### API_AWS_SECRET_ACCESS_KEY?

`string` = `...`

AWS secret access key for SES email service.

#### API_AWS_SES_FROM_EMAIL?

`string` = `...`

Verified email address to send emails from in AWS SES.

#### API_AWS_SES_FROM_NAME?

`string` = `...`

Display name for the sender in emails.

#### API_AWS_SES_REGION?

`string` = `...`

AWS region for SES email service.

#### API_BASE_URL

`string` = `...`

Base url that is exposed to the clients for making requests to the talawa api server at runtime.

#### API_COMMUNITY_FACEBOOK_URL?

`string` = `...`

URL to the facebook account of the community.

#### API_COMMUNITY_GITHUB_URL?

`string` = `...`

URL to the github account of the community.

#### API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION?

`number` = `...`

URL to the instagram account of the community.

#### API_COMMUNITY_INSTAGRAM_URL?

`string` = `...`

URL to the instagram account of the community.

#### API_COMMUNITY_LINKEDIN_URL?

`string` = `...`

URL to the linkedin account of the community.

#### API_COMMUNITY_NAME

`string` = `...`

Name of the community.

#### API_COMMUNITY_REDDIT_URL?

`string` = `...`

URL to the reddit account of the community.

#### API_COMMUNITY_SLACK_URL?

`string` = `...`

URL to the slack account of the community.

#### API_COMMUNITY_WEBSITE_URL?

`string` = `...`

URL to the website of the community.

#### API_COMMUNITY_X_URL?

`string` = `...`

URL to the x account of the community.

#### API_COMMUNITY_YOUTUBE_URL?

`string` = `...`

URL to the youtube account of the community.

#### API_COOKIE_DOMAIN?

`string` = `...`

Optional domain for authentication cookies.
Set this for cross-subdomain authentication (e.g., ".talawa.io" for sharing cookies between admin.talawa.io and api.talawa.io).
Must be a valid domain starting with a dot for subdomain sharing, or a valid hostname.

#### API_COOKIE_SECRET

`string` = `...`

Secret used for signing cookies. Should be a random string of at least 32 characters.
Used by @fastify/cookie for cookie signing and verification.

#### API_EMAIL_PROVIDER?

`"ses"` \| `"smtp"` \| `"mailpit"` = `...`

Email provider selection.
Supported values: 'ses' (Amazon SES), 'smtp', and 'mailpit' (local testing).
Defaults to 'mailpit' if not specified.

#### API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS?

`number` = `...`

Email verification token expiry in seconds.
Default: 86400 (24 hours)

#### API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET?

`string` = `...`

HMAC secret key for hashing email verification tokens.
Used for defense-in-depth; tokens already have 256 bits of entropy.
Should be at least 32 characters for security best practices.
Defaults to a static value if not provided (upgrade to custom secret is recommended).

#### API_ENABLE_EMAIL_QUEUE?

`boolean` = `...`

Enables the background email queue processor. Default should be false in tests / local unless explicitly needed.

#### API_FRONTEND_URL

`string` = `...`

The frontend URL allowed for CORS.

#### API_GRAPHQL_LIST_FIELD_COST

`number` = `...`

#### API_GRAPHQL_MUTATION_BASE_COST

`number` = `...`

#### API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST

`number` = `...`

#### API_GRAPHQL_OBJECT_FIELD_COST

`number` = `...`

#### API_GRAPHQL_SCALAR_FIELD_COST

`number` = `...`

#### API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST

`number` = `...`

#### API_GRAPHQL_SUBSCRIPTION_BASE_COST

`number` = `...`

#### API_HOST

`string` = `...`

Used for providing the host of the domain on which talawa api will run.

#### API_IS_APPLY_DRIZZLE_MIGRATIONS

`boolean` = `...`

Used for providing the decision for whether to apply the sql migrations generated by drizzle-kit to the postgres database at the startup of talawa api.

#### API_IS_GRAPHIQL

`boolean` = `...`

Used for providing the decision for whether to enable graphiql web client. It is useful to enable the graphiql web client in development environments for easier graphql schema exploration.

#### API_IS_PINO_PRETTY

`boolean` = `...`

Used for providing the decision for whether to enable pretty logging with pino.js logger. It is useful to enable prettier logging in development environments for easier developer log comprehension.

#### API_IS_SECURE_COOKIES?

`boolean` = `...`

Whether to use secure cookies (HTTPS only).
Defaults to true in production environments. Set explicitly for testing.

#### API_JWT_EXPIRES_IN

`number` = `...`

Used for providing the number of milli-seconds for setting the expiry time of authentication json web tokens created by talawa api.

#### API_JWT_SECRET

`string` = `...`

Used for providing the secret for signing and verifying authentication json web tokens created by talawa api.

#### API_LOG_LEVEL

`string` = `...`

Used for providing the log level for the logger used in talawa api.

#### API_METRICS_AGGREGATION_CRON_SCHEDULE?

`string` = `...`

Cron schedule for the metrics aggregation background worker.
Default: "*/5 * * * *" (every 5 minutes)

#### API_METRICS_AGGREGATION_ENABLED?

`boolean` = `...`

Enable or disable metrics aggregation background worker.
Default: true

#### API_METRICS_AGGREGATION_WINDOW_MINUTES?

`number` = `...`

Time window in minutes for metrics aggregation.
Only snapshots within this window will be included in aggregation.
Default: 5

#### API_METRICS_API_KEY?

`string` = `...`

API key for authenticating requests to the /metrics/perf endpoint.
If not set, the endpoint is unprotected (suitable for development).
In production, set this to a secure random string.

#### API_METRICS_CACHE_TTL_SECONDS?

`number` = `...`

Time-to-live in seconds for cached aggregated metrics.
Determines how long metrics remain in cache before expiration.
Default: 300 (5 minutes)

#### API_METRICS_ENABLED?

`boolean` = `...`

Master switch to enable or disable metrics collection and aggregation.
When disabled, metrics collection is skipped entirely.
Default: true

#### API_METRICS_SLOW_OPERATION_MS?

`number` = `...`

Threshold in milliseconds for considering an operation as slow.
Operations exceeding this threshold will be tracked in slow operations metrics.
Default: 200

#### API_METRICS_SLOW_REQUEST_MS?

`number` = `...`

Threshold in milliseconds for considering a request as slow.
This is the single source of truth for slow request detection.
Used for both performance metrics tracking and request logging.
Requests exceeding this threshold will be logged as warnings.
Default: 500

#### API_METRICS_SNAPSHOT_RETENTION_COUNT?

`number` = `...`

Maximum number of performance snapshots to retain in memory.
Default: 1000

#### API_MINIO_ACCESS_KEY

`string` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### API_MINIO_END_POINT

`string` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### API_MINIO_PORT

`number` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### API_MINIO_PUBLIC_BASE_URL?

`string` = `...`

#### API_MINIO_SECRET_KEY

`string` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### API_MINIO_USE_SSL?

`boolean` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### API_OAUTH_REQUEST_TIMEOUT_MS?

`number` = `...`

Request timeout in milliseconds for OAuth provider API calls.
Default: 10000 (10 seconds)

#### API_OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE?

`string` = `...`

Cron schedule for the old event instance cleanup background worker.
Default: "0 2 * * *" (daily at 2 AM UTC)

#### API_OTEL_ENABLED

`boolean` = `...`

Enabled state for OpenTelemetry tracing.

#### API_OTEL_ENVIRONMENT?

`string` = `...`

Environment name for OpenTelemetry (e.g. 'production', 'development').

#### API_OTEL_EXPORTER_OTLP_ENDPOINT?

`string` = `...`

OTLP Exporter Endpoint URL.

#### API_OTEL_SAMPLING_RATIO?

`number` = `...`

Sampling ratio for OpenTelemetry traces.
Value between 0 (no traces) and 1 (all traces).
Default: 1 (sample all traces)

#### API_OTEL_SERVICE_NAME?

`string` = `...`

Service name for OpenTelemetry.

#### API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS?

`number` = `...`

Password reset token expiry for Admin Portal in seconds.
Set to 0 for no timeout (tokens never expire).
Default: 3600 (1 hour, similar to Google Admin Console)

#### API_PASSWORD_RESET_TOKEN_HMAC_SECRET?

`string` = `...`

HMAC secret key for hashing password reset tokens.
Used for defense-in-depth; tokens already have 256 bits of entropy.
Should be at least 32 characters for security best practices.
Defaults to a static value if not provided (upgrade to custom secret is recommended).

#### API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS?

`number` = `...`

Password reset token expiry for User Portal in seconds.
Set to 0 for no timeout (tokens never expire).
Default: 1209600 (14 days, similar to Gmail)

#### API_PORT

`number` = `...`

Used for providing the port of the domain on which the server will run.

#### API_POSTGRES_DATABASE

`string` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-DBNAME](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-DBNAME)

#### API_POSTGRES_HOST

`string` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST)

#### API_POSTGRES_PASSWORD

`string` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PASSWORD](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PASSWORD)

#### API_POSTGRES_PORT

`number` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PORT](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PORT)

#### API_POSTGRES_SSL_MODE

`string` \| `boolean` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE)

#### API_POSTGRES_USER

`string` = `...`

More information at this link: [https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-USER](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-USER)

#### API_RATE_LIMIT_BUCKET_CAPACITY

`number` = `...`

Maximum capacity of a user's request bucket for rate limiting.

#### API_RATE_LIMIT_REFILL_RATE

`number` = `...`

Rate at which a user's request bucket refills per second for rate limiting.

#### API_RECURRING_EVENT_GENERATION_CRON_SCHEDULE?

`string` = `...`

Cron schedule for the recurring event instance generation background worker.
Default: "0 * * * *" (every hour at minute 0)

#### API_REDIS_HOST

`string` = `...`

#### API_REDIS_PORT

`number` = `...`

#### API_REFRESH_TOKEN_EXPIRES_IN

`number` = `...`

Used for providing the number of milli-seconds for setting the expiry time of refresh tokens created by talawa api.
Refresh tokens are long-lived tokens used to obtain new access tokens without re-authentication.
Default: 604800000 (7 days)

#### API_SMTP_FROM_EMAIL?

`string` = `...`

Verified email address to send emails from via SMTP.

#### API_SMTP_FROM_NAME?

`string` = `...`

Display name for the sender in emails via SMTP.

#### API_SMTP_HOST?

`string` = `...`

SMTP server hostname for email service.

#### API_SMTP_LOCAL_ADDRESS?

`string` = `...`

Local IP address to bind to for outgoing SMTP connections.

#### API_SMTP_NAME?

`string` = `...`

Client hostname to greet the SMTP server with.
Default: machine hostname

#### API_SMTP_PASSWORD?

`string` = `...`

SMTP password for authentication.

#### API_SMTP_PORT?

`number` = `...`

SMTP server port for email service.
Common values: 587 (TLS), 465 (SSL), 25 (unsecured)

#### API_SMTP_SECURE?

`boolean` = `...`

Whether to use SSL/TLS for SMTP connection.
Set to true for port 465, false for port 587 with STARTTLS.

#### API_SMTP_USER?

`string` = `...`

SMTP username for authentication.

#### CACHE_ENTITY_TTLS?

`string` = `...`

Optional JSON object to override default cache TTL values per entity type.

**Format**: JSON object with entity keys and TTL values in seconds.

**Valid keys**: `user`, `organization`, `event`, `post`

**Example**: `'{"user": 600, "organization": 600, "event": 240, "post": 120}'`

**Error Handling**:
- If the JSON is malformed, the entire value is ignored and default TTLs are used.
  A warning is logged via `console.warn` in `src/services/caching/cacheConfig.ts`.
- Unknown keys are silently ignored (no warning).
- Non-numeric or non-positive values for valid keys are ignored with a warning log.

**Defaults** (defined in `src/services/caching/cacheConfig.ts`):
- `user`: 300 seconds (5 minutes)
- `organization`: 300 seconds (5 minutes)
- `event`: 120 seconds (2 minutes)
- `post`: 60 seconds (1 minute)

**See**

src/services/caching/cacheConfig.ts for TTL parsing logic and defaults.

#### GITHUB_CLIENT_ID?

`string` = `...`

GitHub OAuth Client ID for authentication.

#### GITHUB_CLIENT_SECRET?

`string` = `...`

GitHub OAuth Client Secret for authentication.

#### GITHUB_REDIRECT_URI?

`string` = `...`

GitHub OAuth Redirect URI for authentication callback.

#### GOOGLE_CLIENT_ID?

`string` = `...`

Google OAuth Client ID for authentication.

#### GOOGLE_CLIENT_SECRET?

`string` = `...`

Google OAuth Client Secret for authentication.

#### GOOGLE_REDIRECT_URI?

`string` = `...`

Google OAuth Redirect URI for authentication callback.

#### MINIO_ROOT_USER?

`string` = `...`

More information can be found at: [https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client](https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client)

#### RECAPTCHA_SCORE_THRESHOLD?

`number` = `...`

Score threshold for Google reCAPTCHA v3 verification.
Valid range: 0.0-1.0, where 1.0 is very likely human and 0.0 is very likely bot.
Default: 0.5

#### RECAPTCHA_SECRET_KEY?

`string` = `...`

Secret key for Google reCAPTCHA v3 verification.
Used to verify reCAPTCHA tokens on the server side.

## Returns

`void`

void - Returns nothing; throws [StartupConfigError](../classes/StartupConfigError.md) when any
required secret is empty or contains the placeholder sentinel.

## Throws

If any required secret is empty or contains the
placeholder sentinel.
