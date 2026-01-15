[API Docs](/)

***

# Function: createServer()

> **createServer**(`options?`): `Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>

Defined in: [src/createServer.ts:34](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/createServer.ts#L34)

This function is used to set up the fastify server.

## Parameters

### options?

#### envConfig?

`Partial`\<\{ `API_ACCOUNT_LOCKOUT_DURATION_MS?`: `number`; `API_ACCOUNT_LOCKOUT_THRESHOLD?`: `number`; `API_ADMINISTRATOR_USER_EMAIL_ADDRESS`: `string`; `API_ADMINISTRATOR_USER_NAME`: `string`; `API_ADMINISTRATOR_USER_PASSWORD`: `string`; `API_BASE_URL`: `string`; `API_COMMUNITY_FACEBOOK_URL?`: `string`; `API_COMMUNITY_GITHUB_URL?`: `string`; `API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION?`: `number`; `API_COMMUNITY_INSTAGRAM_URL?`: `string`; `API_COMMUNITY_LINKEDIN_URL?`: `string`; `API_COMMUNITY_NAME`: `string`; `API_COMMUNITY_REDDIT_URL?`: `string`; `API_COMMUNITY_SLACK_URL?`: `string`; `API_COMMUNITY_WEBSITE_URL?`: `string`; `API_COMMUNITY_X_URL?`: `string`; `API_COMMUNITY_YOUTUBE_URL?`: `string`; `API_COOKIE_DOMAIN?`: `string`; `API_COOKIE_SECRET`: `string`; `API_EMAIL_PROVIDER?`: `"ses"` \| `"smtp"`; `API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS?`: `number`; `API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET?`: `string`; `API_ENABLE_EMAIL_QUEUE?`: `boolean`; `API_GRAPHQL_LIST_FIELD_COST`: `number`; `API_GRAPHQL_MUTATION_BASE_COST`: `number`; `API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST`: `number`; `API_GRAPHQL_OBJECT_FIELD_COST`: `number`; `API_GRAPHQL_SCALAR_FIELD_COST`: `number`; `API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST`: `number`; `API_GRAPHQL_SUBSCRIPTION_BASE_COST`: `number`; `API_HOST`: `string`; `API_IS_APPLY_DRIZZLE_MIGRATIONS`: `boolean`; `API_IS_GRAPHIQL`: `boolean`; `API_IS_PINO_PRETTY`: `boolean`; `API_IS_SECURE_COOKIES?`: `boolean`; `API_JWT_EXPIRES_IN`: `number`; `API_JWT_SECRET`: `string`; `API_LOG_LEVEL`: `string`; `API_METRICS_AGGREGATION_CRON_SCHEDULE?`: `string`; `API_METRICS_AGGREGATION_ENABLED?`: `boolean`; `API_METRICS_AGGREGATION_WINDOW_MINUTES?`: `number`; `API_METRICS_API_KEY?`: `string`; `API_METRICS_SNAPSHOT_RETENTION_COUNT?`: `number`; `API_MINIO_ACCESS_KEY`: `string`; `API_MINIO_END_POINT`: `string`; `API_MINIO_PORT`: `number`; `API_MINIO_PUBLIC_BASE_URL?`: `string`; `API_MINIO_SECRET_KEY`: `string`; `API_MINIO_USE_SSL?`: `boolean`; `API_OAUTH_REQUEST_TIMEOUT_MS?`: `number`; `API_OTEL_ENABLED`: `boolean`; `API_OTEL_ENVIRONMENT?`: `string`; `API_OTEL_EXPORTER_OTLP_ENDPOINT?`: `string`; `API_OTEL_SAMPLING_RATIO?`: `number`; `API_OTEL_SERVICE_NAME?`: `string`; `API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS?`: `number`; `API_PASSWORD_RESET_TOKEN_HMAC_SECRET?`: `string`; `API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS?`: `number`; `API_PORT`: `number`; `API_POSTGRES_DATABASE`: `string`; `API_POSTGRES_HOST`: `string`; `API_POSTGRES_PASSWORD`: `string`; `API_POSTGRES_PORT`: `number`; `API_POSTGRES_SSL_MODE`: `string` \| `boolean`; `API_POSTGRES_USER`: `string`; `API_RATE_LIMIT_BUCKET_CAPACITY`: `number`; `API_RATE_LIMIT_REFILL_RATE`: `number`; `API_REDIS_HOST`: `string`; `API_REDIS_PORT`: `number`; `API_REFRESH_TOKEN_EXPIRES_IN`: `number`; `API_SLOW_REQUEST_MS?`: `number`; `AWS_ACCESS_KEY_ID?`: `string`; `AWS_SECRET_ACCESS_KEY?`: `string`; `AWS_SES_FROM_EMAIL?`: `string`; `AWS_SES_FROM_NAME?`: `string`; `AWS_SES_REGION?`: `string`; `CACHE_ENTITY_TTLS?`: `string`; `FRONTEND_URL`: `string`; `GITHUB_CLIENT_ID?`: `string`; `GITHUB_CLIENT_SECRET?`: `string`; `GITHUB_REDIRECT_URI?`: `string`; `GOOGLE_CLIENT_ID?`: `string`; `GOOGLE_CLIENT_SECRET?`: `string`; `GOOGLE_REDIRECT_URI?`: `string`; `MINIO_ROOT_USER?`: `string`; `OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE?`: `string`; `RECAPTCHA_SECRET_KEY?`: `string`; `RECURRING_EVENT_GENERATION_CRON_SCHEDULE?`: `string`; `SMTP_FROM_EMAIL?`: `string`; `SMTP_FROM_NAME?`: `string`; `SMTP_HOST?`: `string`; `SMTP_PASSWORD?`: `string`; `SMTP_PORT?`: `number`; `SMTP_SECURE?`: `boolean`; `SMTP_USER?`: `string`; \}\>

Optional custom configuration environment variables that would merge or override the default configuration environment variables used by talawa api.

## Returns

`Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>
