[API Docs](/)

***

# Function: metricsCacheProxy()

> **metricsCacheProxy**(`cache`, `perf`): [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: [src/services/caching/metricsCacheProxy.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/metricsCacheProxy.ts#L18)

Wraps a CacheService with performance tracking.
Tracks cache hits and misses for monitoring purposes.

## Parameters

### cache

[`CacheService`](../../CacheService/interfaces/CacheService.md)

The underlying cache service to wrap

### perf

[`PerformanceTracker`](../../../../utilities/metrics/performanceTracker/interfaces/PerformanceTracker.md)

Performance tracker instance

## Returns

[`CacheService`](../../CacheService/interfaces/CacheService.md)

A cache service proxy that tracks performance metrics

## Example

```typescript
const trackedCache = metricsCacheProxy(app.cache, req.perf);
// Use trackedCache in GraphQL context
```
