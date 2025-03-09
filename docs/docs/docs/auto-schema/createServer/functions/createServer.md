[Admin Docs](/)

***

# Function: createServer()

> **createServer**(`options`?): `Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>

Defined in: [src/createServer.ts:29](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/createServer.ts#L29)

This function is used to set up the fastify server.

## Parameters

### options?

#### envConfig?

`Partial`\<\{ `API_ADMINISTRATOR_USER_EMAIL_ADDRESS`: `string`; `API_ADMINISTRATOR_USER_NAME`: `string`; `API_ADMINISTRATOR_USER_PASSWORD`: `string`; `API_BASE_URL`: `string`; `API_COMMUNITY_FACEBOOK_URL`: `string`; `API_COMMUNITY_GITHUB_URL`: `string`; `API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION`: `number`; `API_COMMUNITY_INSTAGRAM_URL`: `string`; `API_COMMUNITY_LINKEDIN_URL`: `string`; `API_COMMUNITY_NAME`: `string`; `API_COMMUNITY_REDDIT_URL`: `string`; `API_COMMUNITY_SLACK_URL`: `string`; `API_COMMUNITY_WEBSITE_URL`: `string`; `API_COMMUNITY_X_URL`: `string`; `API_COMMUNITY_YOUTUBE_URL`: `string`; `API_HOST`: `string`; `API_IS_APPLY_DRIZZLE_MIGRATIONS`: `boolean`; `API_IS_GRAPHIQL`: `boolean`; `API_IS_PINO_PRETTY`: `boolean`; `API_JWT_EXPIRES_IN`: `number`; `API_JWT_SECRET`: `string`; `API_LOG_LEVEL`: `"debug"` \| `"error"` \| `"fatal"` \| `"info"` \| `"trace"` \| `"warn"`; `API_MINIO_ACCESS_KEY`: `string`; `API_MINIO_END_POINT`: `string`; `API_MINIO_PORT`: `number`; `API_MINIO_SECRET_KEY`: `string`; `API_MINIO_USE_SSL`: `boolean`; `API_PORT`: `number`; `API_POSTGRES_DATABASE`: `string`; `API_POSTGRES_HOST`: `string`; `API_POSTGRES_PASSWORD`: `string`; `API_POSTGRES_PORT`: `number`; `API_POSTGRES_SSL_MODE`: `boolean` \| `"allow"` \| `"prefer"` \| `"require"` \| `"verify-full"`; `API_POSTGRES_USER`: `string`; `MINIO_ROOT_USER`: `string`; \}\>

Optional custom configuration environment variables that would merge or override the default configuration environment variables used by talawa api.

## Returns

`Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>
