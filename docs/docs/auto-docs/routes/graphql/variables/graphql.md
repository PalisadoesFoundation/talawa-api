[API Docs](/)

***

# Variable: graphql()

> `const` **graphql**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/routes/graphql.ts:320](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/graphql.ts#L320)

This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
