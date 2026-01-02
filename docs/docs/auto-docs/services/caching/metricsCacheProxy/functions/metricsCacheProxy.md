[API Docs](/)

***

# Function: metricsCacheProxy()

> **metricsCacheProxy**(`cache`, `perf`): [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: [src/services/caching/metricsCacheProxy.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/metricsCacheProxy.ts#L22)

Creates a cache service proxy that wraps an existing cache service
with request-scoped performance tracking.

This allows the global cache service (without perf tracking) to be
instrumented per-request by wrapping it with a performance tracker
from the request context.

## Parameters

### cache

[`CacheService`](../../CacheService/interfaces/CacheService.md)

The underlying cache service to wrap

### perf

[`PerformanceTracker`](../../../../utilities/metrics/performanceTracker/interfaces/PerformanceTracker.md)

The performance tracker for this request

## Returns

[`CacheService`](../../CacheService/interfaces/CacheService.md)

A proxied cache service that tracks performance metrics

## Example

```typescript
// In GraphQL context creation
const cache = metricsCacheProxy(fastify.cache, request.perf);
```
