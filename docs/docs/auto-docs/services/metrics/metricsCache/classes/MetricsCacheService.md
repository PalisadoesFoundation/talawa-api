[API Docs](/)

***

# Class: MetricsCacheService

Defined in: [src/services/metrics/metricsCache.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L21)

Service for caching aggregated metrics data.
Provides methods to cache and retrieve metrics snapshots with configurable TTL.

All cache operations are wrapped with try/catch for graceful degradation.
Cache failures should not break metrics collection or request handling.

## Constructors

### Constructor

> **new MetricsCacheService**(`cache`, `logger?`, `defaultTtlSeconds?`): `MetricsCacheService`

Defined in: [src/services/metrics/metricsCache.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L22)

#### Parameters

##### cache

[`CacheService`](../../../caching/CacheService/interfaces/CacheService.md)

##### logger?

`Logger`

##### defaultTtlSeconds?

`number` = `300`

#### Returns

`MetricsCacheService`

## Methods

### cacheAggregatedMetrics()

> **cacheAggregatedMetrics**(`metrics`, `timestamp`, `ttlSeconds?`): `Promise`\<`void`\>

Defined in: [src/services/metrics/metricsCache.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L41)

Cache aggregated metrics with a timestamp identifier.

#### Parameters

##### metrics

[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md)

The aggregated metrics to cache

##### timestamp

`string`

Timestamp identifier (milliseconds since epoch as string)

##### ttlSeconds?

`number`

Optional TTL override (defaults to configured default)

#### Returns

`Promise`\<`void`\>

Promise that resolves when caching is complete (or fails silently)

#### Example

```typescript
await metricsCache.cacheAggregatedMetrics(metrics, "1705320000000", 600);
```

***

### cacheWindowedMetrics()

> **cacheWindowedMetrics**(`metrics`, `windowType`, `date`, `ttlSeconds?`): `Promise`\<`void`\>

Defined in: [src/services/metrics/metricsCache.ts:214](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L214)

Cache aggregated metrics for a time window (hourly or daily).

#### Parameters

##### metrics

[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md)

The aggregated metrics to cache

##### windowType

Type of time window ('hourly' or 'daily')

`"hourly"` | `"daily"`

##### date

`string`

Date string in format 'YYYY-MM-DD' for daily or 'YYYY-MM-DD-HH' for hourly

##### ttlSeconds?

`number`

Optional TTL override (defaults to longer TTL for windowed metrics)

#### Returns

`Promise`\<`void`\>

Promise that resolves when caching is complete (or fails silently)

#### Example

```typescript
// Cache hourly metrics with default TTL (3600 seconds)
await metricsCache.cacheWindowedMetrics(metrics, 'hourly', '2024-01-15-14');

// Cache daily metrics with custom TTL
await metricsCache.cacheWindowedMetrics(metrics, 'daily', '2024-01-15', 86400);
```

***

### getCachedMetrics()

> **getCachedMetrics**(`timestamp`): `Promise`\<[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md) \| `null`\>

Defined in: [src/services/metrics/metricsCache.ts:113](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L113)

Retrieve cached aggregated metrics by timestamp.

#### Parameters

##### timestamp

`string`

Timestamp identifier (milliseconds since epoch as string)

#### Returns

`Promise`\<[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md) \| `null`\>

Cached metrics or null if not found/expired

#### Example

```typescript
const metrics = await metricsCache.getCachedMetrics("1705320000000");
if (metrics) {
  // Use cached metrics
}
```

***

### getCachedMetricsByWindow()

> **getCachedMetricsByWindow**(`windowType`, `date`): `Promise`\<[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md) \| `null`\>

Defined in: [src/services/metrics/metricsCache.ts:160](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L160)

Retrieve cached aggregated metrics by time window (hourly or daily).

#### Parameters

##### windowType

Type of time window ('hourly' or 'daily')

`"hourly"` | `"daily"`

##### date

`string`

Date string in format 'YYYY-MM-DD' for daily or 'YYYY-MM-DD-HH' for hourly

#### Returns

`Promise`\<[`AggregatedMetrics`](../../../../workers/metrics/types/interfaces/AggregatedMetrics.md) \| `null`\>

Cached metrics or null if not found/expired

#### Example

```typescript
// Get hourly metrics for 2024-01-15 at 14:00
const metrics = await metricsCache.getCachedMetricsByWindow('hourly', '2024-01-15-14');

// Get daily metrics for 2024-01-15
const metrics = await metricsCache.getCachedMetricsByWindow('daily', '2024-01-15');
```

***

### invalidateMetricsCache()

> **invalidateMetricsCache**(`pattern?`): `Promise`\<`void`\>

Defined in: [src/services/metrics/metricsCache.ts:293](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCache.ts#L293)

Invalidate metrics cache entries matching a pattern.

#### Parameters

##### pattern?

`string`

Optional glob pattern (e.g., "metrics:aggregated:*" or "metrics:aggregated:hourly:*")
                 If not provided, invalidates all metrics cache entries

#### Returns

`Promise`\<`void`\>

Promise that resolves when invalidation is complete (or fails silently)

#### Example

```typescript
// Invalidate all metrics
await metricsCache.invalidateMetricsCache();

// Invalidate only hourly metrics
await metricsCache.invalidateMetricsCache("aggregated:hourly:*");
```
