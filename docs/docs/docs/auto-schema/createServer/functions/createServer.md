[Admin Docs](/)

***

# Function: createServer()

> **createServer**(`options`?): `Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>

Defined in: [src/createServer.ts:30](https://github.com/PalisadoesFoundation/talawa-api/blob/f1b6ec0d386e11c6dc4f3cf8bb763223ff502e1e/src/createServer.ts#L30)

This function is used to set up the fastify server.

## Parameters

### options?

#### envConfig?

`Partial`\<\{ `API_ADMINISTRATOR_USER_EMAIL_ADDRESS`: `string`; `API_ADMINISTRATOR_USER_NAME`: `string`; `API_ADMINISTRATOR_USER_PASSWORD`: `string`; `API_BASE_URL`: `string`; `API_COMMUNITY_FACEBOOK_URL`: `string`; `API_COMMUNITY_GITHUB_URL`: `string`; `API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION`: `number`; `API_COMMUNITY_INSTAGRAM_URL`: `string`; `API_COMMUNITY_LINKEDIN_URL`: `string`; `API_COMMUNITY_NAME`: `string`; `API_COMMUNITY_REDDIT_URL`: `string`; `API_COMMUNITY_SLACK_URL`: `string`; `API_COMMUNITY_WEBSITE_URL`: `string`; `API_COMMUNITY_X_URL`: `string`; `API_COMMUNITY_YOUTUBE_URL`: `string`; `API_GRAPHQL_LIST_FIELD_COST`: `number`; `API_GRAPHQL_MUTATION_BASE_COST`: `number`; `API_GRAPHQL_OBJECT_FIELD_COST`: `number`; `API_GRAPHQL_SCALAR_FIELD_COST`: `number`; `API_HOST`: `string`; `API_IS_APPLY_DRIZZLE_MIGRATIONS`: `boolean`; `API_IS_GRAPHIQL`: `boolean`; `API_IS_PINO_PRETTY`: `boolean`; `API_JWT_EXPIRES_IN`: `number`; `API_JWT_SECRET`: `string`; `API_LOG_LEVEL`: `"debug"` \| `"error"` \| `"fatal"` \| `"info"` \| `"trace"` \| `"warn"`; `API_MINIO_ACCESS_KEY`: `string`; `API_MINIO_END_POINT`: `string`; `API_MINIO_PORT`: `number`; `API_MINIO_SECRET_KEY`: `string`; `API_MINIO_USE_SSL`: `boolean`; `API_PORT`: `number`; `API_POSTGRES_DATABASE`: `string`; `API_POSTGRES_HOST`: `string`; `API_POSTGRES_PASSWORD`: `string`; `API_POSTGRES_PORT`: `number`; `API_POSTGRES_SSL_MODE`: `boolean` \| `"allow"` \| `"prefer"` \| `"require"` \| `"verify-full"`; `API_POSTGRES_USER`: `string`; `API_RATE_LIMIT_BUCKET_CAPACITY`: `number`; `API_RATE_LIMIT_REFILL_RATE`: `number`; `API_REDIS_HOST`: `string`; `API_REDIS_PORT`: `number`; `MINIO_ROOT_USER`: `string`; \}\>

Optional custom configuration environment variables that would merge or override the default configuration environment variables used by talawa api.

## Returns

`Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>
