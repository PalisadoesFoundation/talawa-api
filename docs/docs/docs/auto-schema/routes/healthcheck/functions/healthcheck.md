[Admin Docs](/)

***

# Function: healthcheck()

> **healthcheck**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/healthcheck.ts:6](https://github.com/syedali237/talawa-api/blob/aa4e819f67def774740606c7a534dc013cdfe393/src/routes/healthcheck.ts#L6)

This fastify route plugin is used to initialize a healthcheck endpoint on the fastify server for external services to check health of talawa api.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
