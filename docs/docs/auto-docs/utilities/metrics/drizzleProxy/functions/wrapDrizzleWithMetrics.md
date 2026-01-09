[API Docs](/)

***

# Function: wrapDrizzleWithMetrics()

> **wrapDrizzleWithMetrics**(`client`, `getPerf`): [`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

Defined in: [src/utilities/metrics/drizzleProxy.ts:34](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/drizzleProxy.ts#L34)

Wraps a Drizzle client with automatic performance tracking.
All database operations are automatically timed and tracked.

## Parameters

### client

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The original Drizzle client to wrap

### getPerf

[`PerfGetter`](../type-aliases/PerfGetter.md)

Function that returns the current request's performance tracker

## Returns

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

A proxied Drizzle client with automatic tracking, or the original client if perf is not available

## Example

```typescript
const wrappedClient = wrapDrizzleWithMetrics(
  fastify.drizzleClient,
  () => request.perf
);
```
