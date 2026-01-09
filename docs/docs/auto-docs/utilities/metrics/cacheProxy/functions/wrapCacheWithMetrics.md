[API Docs](/)

***

# Function: wrapCacheWithMetrics()

> **wrapCacheWithMetrics**(`cache`, `getPerf`): [`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

Defined in: [src/utilities/metrics/cacheProxy.ts:31](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/cacheProxy.ts#L31)

Wraps a CacheService with automatic performance tracking.
All cache operations are automatically timed, and hits/misses are tracked.

## Parameters

### cache

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

The original CacheService to wrap

### getPerf

`PerfGetter`

Function that returns the current request's performance tracker

## Returns

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

A proxied CacheService with automatic tracking, or the original cache if perf is not available

## Example

```typescript
const wrappedCache = wrapCacheWithMetrics(
  fastify.cache,
  () => request.perf
);
```
