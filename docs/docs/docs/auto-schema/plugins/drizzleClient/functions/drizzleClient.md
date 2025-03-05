[Admin Docs](/)

***

# Function: drizzleClient()

> **drizzleClient**(`fastify`): `Promise`\<`void`\>

Integrates a drizzle client instance on a namespace `drizzleClient` on the global fastify instance.

## Parameters

### fastify

`FastifyInstance`\<`IncomingMessage`, `ServerResponse`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
import drizzleClientPlugin from "~/src/plugins/drizzleClient";

fastify.register(drizzleClientPlugin, {});
const user = await fastify.drizzleClient.query.usersTable.findFirst();
```

## Defined in

[src/plugins/drizzleClient.ts:22](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/plugins/drizzleClient.ts#L22)
