[Admin Docs](/)

***

# Variable: routes()

> `const` **routes**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/routes/index.ts:14](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/routes/index.ts#L14)

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
