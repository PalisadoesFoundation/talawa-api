[Admin Docs](/)

***

# Function: healthcheck()

> **healthcheck**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/healthcheck.ts:6](https://github.com/Suyash878/talawa-api/blob/dcefc5853f313fc5e9e097849457ef0d144bcf61/src/routes/healthcheck.ts#L6)

This fastify route plugin is used to initialize a healthcheck endpoint on the fastify server for external services to check health of talawa api.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
