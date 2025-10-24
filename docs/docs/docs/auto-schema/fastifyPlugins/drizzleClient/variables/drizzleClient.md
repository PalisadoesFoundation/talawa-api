[Admin Docs](/)

***

# Variable: drizzleClient()

> `const` **drizzleClient**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/drizzleClient.ts:22](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/fastifyPlugins/drizzleClient.ts#L22)

Integrates a drizzle client instance on a namespace `drizzleClient` on the global fastify instance.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
import drizzleClientPlugin from "~/src/plugins/drizzleClient";

fastify.register(drizzleClientPlugin, {});
const user = await fastify.drizzleClient.query.usersTable.findFirst();
```
