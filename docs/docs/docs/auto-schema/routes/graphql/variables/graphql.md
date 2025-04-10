[Admin Docs](/)

***

# Variable: graphql()

> `const` **graphql**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/routes/graphql.ts:86](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/routes/graphql.ts#L86)

This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
