[API Docs](/)

***

# Function: createDataloaders()

> **createDataloaders**(`db`, `perf?`): [`Dataloaders`](../type-aliases/Dataloaders.md)

Defined in: [src/utilities/dataloaders/index.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L49)

Creates all DataLoaders for a request context.
Each loader is request-scoped to ensure proper caching and isolation.

## Parameters

### db

[`DrizzleClient`](../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

The Drizzle client instance for database operations.

### perf?

[`PerformanceTracker`](../../metrics/performanceTracker/interfaces/PerformanceTracker.md)

Optional performance tracker for monitoring database operations.

## Returns

[`Dataloaders`](../type-aliases/Dataloaders.md)

An object containing all DataLoaders.

## Example

```typescript
const dataloaders = createDataloaders(drizzleClient, req.perf);
const user = await dataloaders.user.load(userId);
const organization = await dataloaders.organization.load(orgId);
```
