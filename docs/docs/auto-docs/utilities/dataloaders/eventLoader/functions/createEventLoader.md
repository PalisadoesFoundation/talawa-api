[API Docs](/)

***

# Function: createEventLoader()

> **createEventLoader**(`db`): `any`

Defined in: [src/utilities/dataloaders/eventLoader.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/eventLoader.ts#L23)

Creates a DataLoader for batching event lookups by ID.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

## Returns

`any`

A DataLoader that batches and caches event lookups within a single request.

## Example

```typescript
const eventLoader = createEventLoader(drizzleClient);
const event = await eventLoader.load(eventId);
```
