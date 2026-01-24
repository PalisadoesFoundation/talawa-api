[API Docs](/)

***

# Function: createEventLoader()

> **createEventLoader**(`db`, `cache`, `perf?`): `DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

Defined in: src/utilities/dataloaders/eventLoader.ts:36

Creates a DataLoader for batching event lookups by ID.
When a cache service is provided, wraps the batch function with cache-first logic.
When a performance tracker is provided, wraps the batch function with performance metrics.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### cache

Optional cache service for cache-first lookups. Pass null to disable caching.

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md) | `null`

### perf?

[`PerformanceTracker`](../../../metrics/performanceTracker/interfaces/PerformanceTracker.md)

Optional performance tracker for monitoring database operation durations.

## Returns

`DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

A DataLoader that batches and caches event lookups within a single request.

## Example

```typescript
const eventLoader = createEventLoader(drizzleClient, cacheService, perfTracker);
const event = await eventLoader.load(eventId);
```
