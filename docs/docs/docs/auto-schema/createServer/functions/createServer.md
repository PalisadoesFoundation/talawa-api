[Admin Docs](/)

***

# Function: createServer()

> **createServer**(`options?`): `Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>

Defined in: [src/createServer.ts:30](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/createServer.ts#L30)

This function is used to set up the fastify server.

## Parameters

### options?

#### envConfig?

`Partial`\<[`EnvConfig`](../../envConfigSchema/type-aliases/EnvConfig.md)\>

Optional custom configuration environment variables that would merge or override the default configuration environment variables used by talawa api.

## Returns

`Promise`\<`FastifyInstance`\<`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>\>
