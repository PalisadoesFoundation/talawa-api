[Admin Docs](/)

***

# Function: routes()

> **routes**(`fastify`): `Promise`\<`void`\>

Defined in: [src/routes/index.ts:13](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/routes/index.ts#L13)

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
