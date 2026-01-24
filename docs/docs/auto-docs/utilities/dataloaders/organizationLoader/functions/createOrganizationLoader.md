[API Docs](/)

***

# Function: createOrganizationLoader()

> **createOrganizationLoader**(`db`, `cache`, `perf?`): `DataLoader`\<`string`, \{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \} \| `null`, `string`\>

Defined in: src/utilities/dataloaders/organizationLoader.ts:36

Creates a DataLoader for batching organization lookups by ID.
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

`DataLoader`\<`string`, \{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `string` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `string` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \} \| `null`, `string`\>

A DataLoader that batches and caches organization lookups within a single request.

## Example

```typescript
const organizationLoader = createOrganizationLoader(drizzleClient, cacheService, perfTracker);
const organization = await organizationLoader.load(organizationId);
```
