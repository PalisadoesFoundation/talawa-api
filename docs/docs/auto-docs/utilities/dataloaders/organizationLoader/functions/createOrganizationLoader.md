[API Docs](/)

***

# Function: createOrganizationLoader()

> **createOrganizationLoader**(`db`): `any`

Defined in: [src/utilities/dataloaders/organizationLoader.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/organizationLoader.ts#L23)

Creates a DataLoader for batching organization lookups by ID.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

## Returns

`any`

A DataLoader that batches and caches organization lookups within a single request.

## Example

```typescript
const organizationLoader = createOrganizationLoader(drizzleClient);
const organization = await organizationLoader.load(organizationId);
```
