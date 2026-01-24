[API Docs](/)

***

# Function: invalidateEntity()

> **invalidateEntity**(`cache`, `entity`, `id`): `Promise`\<`void`\>

Defined in: src/services/caching/invalidation.ts:16

Invalidate a specific entity from the cache.

## Parameters

### cache

[`CacheService`](../../CacheService/interfaces/CacheService.md)

The cache service instance.

### entity

`string`

The entity type (e.g., "user", "organization").

### id

The entity ID.

`string` | `number`

## Returns

`Promise`\<`void`\>

## Example

```typescript
await invalidateEntity(ctx.cache, "organization", args.id);
```
