[Admin Docs](/)

***

# Function: graphql()

> **graphql**(`fastify`): `Promise`\<`void`\>

Defined in: [src/routes/graphql.ts:83](https://github.com/PalisadoesFoundation/talawa-api/blob/be5955174726b793a9d0896706e81c3e939858bf/src/routes/graphql.ts#L83)

This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
