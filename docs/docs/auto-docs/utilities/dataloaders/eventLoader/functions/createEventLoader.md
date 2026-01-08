[API Docs](/)

***

# Function: createEventLoader()

> **createEventLoader**(`db`, `cache`): `DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

Defined in: [src/utilities/dataloaders/eventLoader.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/eventLoader.ts#L30)

Creates a DataLoader for batching event lookups by ID.
When a cache service is provided, wraps the batch function with cache-first logic.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### cache

Optional cache service for cache-first lookups. Pass null to disable caching.

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md) | `null`

## Returns

`DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

A DataLoader that batches and caches event lookups within a single request.

## Example

```typescript
const eventLoader = createEventLoader(drizzleClient, cacheService);
const event = await eventLoader.load(eventId);
```
