[Admin Docs](/)

***

# Function: healthcheck()

> **healthcheck**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/healthcheck.ts:6](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/routes/healthcheck.ts#L6)

This fastify route plugin is used to initialize a healthcheck endpoint on the fastify server for external services to check health of talawa api.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
