[API Docs](/)

***

# Variable: routes()

> `const` **routes**: (`fastify`) => `Promise`\<`void`\>

Defined in: src/routes/index.ts:16

This fastify plugin function contains all talawa api routes within it.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>

## Example

```typescript
import routes from "./routes/index";
fastify.register(routes, {});
```
