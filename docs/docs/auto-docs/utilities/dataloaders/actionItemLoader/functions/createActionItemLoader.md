[API Docs](/)

***

# Function: createActionItemLoader()

> **createActionItemLoader**(`db`): `any`

Defined in: [src/utilities/dataloaders/actionItemLoader.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/actionItemLoader.ts#L23)

Creates a DataLoader for batching action item lookups by ID.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

## Returns

`any`

A DataLoader that batches and caches action item lookups within a single request.

## Example

```typescript
const actionItemLoader = createActionItemLoader(drizzleClient);
const actionItem = await actionItemLoader.load(actionItemId);
```
