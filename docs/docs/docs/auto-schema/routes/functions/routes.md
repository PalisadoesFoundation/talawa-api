[Admin Docs](/)

***

# Function: routes()

> **routes**(`fastify`): `Promise`\<`void`\>

Defined in: [src/routes/index.ts:13](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/routes/index.ts#L13)

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
