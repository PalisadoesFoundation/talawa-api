[API Docs](/)

***

# Function: wrapDrizzleWithMetrics()

> **wrapDrizzleWithMetrics**(`client`, `getPerf`): `DrizzleClient`

Defined in: [src/utilities/metrics/drizzleProxy.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/drizzleProxy.ts#L37)

Wraps a Drizzle client with automatic performance tracking.
All database operations are automatically timed and tracked.

## Parameters

### client

`DrizzleClient`

The original Drizzle client to wrap

### getPerf

`PerfGetter`

Function that returns the current request's performance tracker

## Returns

`DrizzleClient`

A proxied Drizzle client with automatic tracking, or the original client if perf is not available

## Example

```typescript
const wrappedClient = wrapDrizzleWithMetrics(
  fastify.drizzleClient,
  () => request.perf
);
```
