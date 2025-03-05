[Admin Docs](/)

***

# Function: drizzleClient()

> **drizzleClient**(`fastify`): `Promise`\<`void`\>

Defined in: [src/plugins/drizzleClient.ts:22](https://github.com/PalisadoesFoundation/talawa-api/blob/36e30b39ce897bdded5fea4859d9ae00485b5a4c/src/plugins/drizzleClient.ts#L22)

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
