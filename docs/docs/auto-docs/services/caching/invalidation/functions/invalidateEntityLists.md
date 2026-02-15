[API Docs](/)

***

# Function: invalidateEntityLists()

> **invalidateEntityLists**(`cache`, `entity`): `Promise`\<`void`\>

Defined in: [src/services/caching/invalidation.ts:35](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/invalidation.ts#L35)

Invalidate all list caches for a specific entity type.
Use this after mutations that affect list queries (create, delete, bulk update).

## Parameters

### cache

An object with a `clearByPattern` method (e.g., CacheService or metrics proxy).

#### clearByPattern

### entity

`string`

The entity type.

## Returns

`Promise`\<`void`\>

## Example

```typescript
await invalidateEntityLists(ctx.cache, "organization");
```
