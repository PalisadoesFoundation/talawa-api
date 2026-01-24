[**talawa-api**](../../../README.md)

***

# Function: createDataloaders()

> **createDataloaders**(`db`, `cache`, `perf?`): [`Dataloaders`](../type-aliases/Dataloaders.md)

Defined in: src/utilities/dataloaders/index.ts:53

Creates all DataLoaders for a request context.
Each loader is request-scoped to ensure proper caching and isolation.
When a cache service is provided, DataLoaders use cache-first lookup strategy.
When a performance tracker is provided, DataLoaders track database operation durations.

## Parameters

### db

[`DrizzleClient`](../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### cache

Optional cache service for cache-first lookups. Pass null to disable caching.

[`CacheService`](../../../services/caching/CacheService/interfaces/CacheService.md) | `null`

### perf?

[`PerformanceTracker`](../../metrics/performanceTracker/interfaces/PerformanceTracker.md)

Optional performance tracker for monitoring database operation durations.

## Returns

[`Dataloaders`](../type-aliases/Dataloaders.md)

An object containing all DataLoaders.

## Example

```typescript
const dataloaders = createDataloaders(drizzleClient, cacheService, perfTracker);
const user = await dataloaders.user.load(userId);
const organization = await dataloaders.organization.load(orgId);
```
