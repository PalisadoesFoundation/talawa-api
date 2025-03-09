[Admin Docs](/)

***

# Function: routes()

> **routes**(`fastify`): `Promise`\<`void`\>

Defined in: [src/routes/index.ts:13](https://github.com/PratapRathi/talawa-api/blob/72aae1e3507e4dd8ad32a69696c05d569e0ed095/src/routes/index.ts#L13)

This fastify plugin function contains all talawa api routes within it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
import routes from "./routes/index";
fastify.register(routes, {});
```
