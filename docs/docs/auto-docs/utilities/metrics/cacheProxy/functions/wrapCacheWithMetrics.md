[API Docs](/)

***

# Function: wrapCacheWithMetrics()

> **wrapCacheWithMetrics**(`cache`, `getPerf`): [`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

Defined in: [src/utilities/metrics/cacheProxy.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/cacheProxy.ts#L32)

Wraps a CacheService with automatic performance tracking.
All cache operations are automatically timed, and hits/misses are tracked.
Uses a Proxy to call getPerf() at call-time, enabling dynamic metrics and preserving all cache properties.

## Parameters

### cache

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

The original CacheService to wrap

### getPerf

`PerfGetter`

Function that returns the current request's performance tracker

## Returns

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md)

A proxied CacheService with automatic tracking that always wraps the cache

## Example

```typescript
const wrappedCache = wrapCacheWithMetrics(
  fastify.cache,
  () => request.perf
);
```
