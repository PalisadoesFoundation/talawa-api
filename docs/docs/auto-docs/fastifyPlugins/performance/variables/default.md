[API Docs](/)

***

# Variable: default()

> **default**: (`app`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/performance.ts:62](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/performance.ts#L62)

Fastify plugin that adds performance tracking to all requests.
- Attaches a performance tracker to each request
- Adds Server-Timing headers to responses
- Provides /metrics/perf endpoint for recent performance snapshots

## Parameters

### app

`FastifyInstance`

## Returns

`Promise`\<`void`\>

## Example

```typescript
// Performance tracker is automatically available on requests
app.addHook("onRequest", async (req) => {
  await req.perf?.time("custom-op", async () => {
    // Your operation
  });
});
```
