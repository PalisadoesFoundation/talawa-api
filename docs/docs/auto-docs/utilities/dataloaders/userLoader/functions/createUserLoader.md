[API Docs](/)

***

# Function: createUserLoader()

> **createUserLoader**(`db`): `any`

Defined in: [src/utilities/dataloaders/userLoader.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/userLoader.ts#L23)

Creates a DataLoader for batching user lookups by ID.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

## Returns

`any`

A DataLoader that batches and caches user lookups within a single request.

## Example

```typescript
const userLoader = createUserLoader(drizzleClient);
const user = await userLoader.load(userId);
```
