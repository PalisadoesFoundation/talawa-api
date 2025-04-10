[Admin Docs](/)

***

# Variable: graphql()

> `const` **graphql**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/routes/graphql.ts:86](https://github.com/PurnenduMIshra129th/talawa-api/blob/89904a627ec60a3b378f6b033f4255df4e9e59ab/src/routes/graphql.ts#L86)

This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
