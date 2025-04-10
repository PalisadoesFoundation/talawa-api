[Admin Docs](/)

***

# Function: graphql()

> **graphql**(`fastify`): `Promise`\<`void`\>

Defined in: [src/routes/graphql.ts:86](https://github.com/NishantSinghhhhh/talawa-api/blob/f689e29732f10b6ae99c0bb4da8790277c8377f0/src/routes/graphql.ts#L86)

This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
