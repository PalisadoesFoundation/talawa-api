[API Docs](/)

***

# Function: createEventLoader()

> **createEventLoader**(`db`, `perf?`): `DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

Defined in: [src/utilities/dataloaders/eventLoader.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/eventLoader.ts#L26)

Creates a DataLoader for batching event lookups by ID.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### perf?

[`PerformanceTracker`](../../../metrics/performanceTracker/interfaces/PerformanceTracker.md)

Optional performance tracker for monitoring database operations.

## Returns

`DataLoader`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \} \| `null`, `string`\>

A DataLoader that batches and caches event lookups within a single request.

## Example

```typescript
const eventLoader = createEventLoader(drizzleClient, req.perf);
const event = await eventLoader.load(eventId);
```
