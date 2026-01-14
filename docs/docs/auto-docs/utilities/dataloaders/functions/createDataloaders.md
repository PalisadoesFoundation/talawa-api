[**talawa-api**](../../../README.md)

***

# Function: createDataloaders()

> **createDataloaders**(`db`): [`Dataloaders`](../type-aliases/Dataloaders.md)

Defined in: [src/utilities/dataloaders/index.ts:47](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/dataloaders/index.ts#L47)

Creates all DataLoaders for a request context.
Each loader is request-scoped to ensure proper caching and isolation.

## Parameters

### db

[`DrizzleClient`](../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

## Returns

[`Dataloaders`](../type-aliases/Dataloaders.md)

An object containing all DataLoaders.

## Example

```typescript
const dataloaders = createDataloaders(drizzleClient);
const user = await dataloaders.user.load(userId);
const organization = await dataloaders.organization.load(orgId);
```
