[API Docs](/)

***

# Function: createActionItemLoader()

> **createActionItemLoader**(`db`, `cache`): `DataLoader`\<`string`, \{ `assignedAt`: `Date`; `categoryId`: `string` \| `null`; `completionAt`: `Date` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `eventId`: `string` \| `null`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `boolean` \| `null`; `organizationId`: `string`; `postCompletionNotes`: `string` \| `null`; `preCompletionNotes`: `string` \| `null`; `recurringEventInstanceId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `volunteerGroupId`: `string` \| `null`; `volunteerId`: `string` \| `null`; \} \| `null`, `string`\>

Defined in: [src/utilities/dataloaders/actionItemLoader.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/actionItemLoader.ts#L30)

Creates a DataLoader for batching action item lookups by ID.
When a cache service is provided, wraps the batch function with cache-first logic.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### cache

Optional cache service for cache-first lookups. Pass null to disable caching.

[`CacheService`](../../../../services/caching/CacheService/interfaces/CacheService.md) | `null`

## Returns

`DataLoader`\<`string`, \{ `assignedAt`: `Date`; `categoryId`: `string` \| `null`; `completionAt`: `Date` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `eventId`: `string` \| `null`; `id`: `string`; `isCompleted`: `boolean`; `isTemplate`: `boolean` \| `null`; `organizationId`: `string`; `postCompletionNotes`: `string` \| `null`; `preCompletionNotes`: `string` \| `null`; `recurringEventInstanceId`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `volunteerGroupId`: `string` \| `null`; `volunteerId`: `string` \| `null`; \} \| `null`, `string`\>

A DataLoader that batches and caches action item lookups within a single request.

## Example

```typescript
const actionItemLoader = createActionItemLoader(drizzleClient, cacheService);
const actionItem = await actionItemLoader.load(actionItemId);
```
