[API Docs](/)

***

# Function: invalidateEntity()

> **invalidateEntity**(`cache`, `entity`, `id`): `Promise`\<`void`\>

Defined in: [src/services/caching/invalidation.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/invalidation.ts#L16)

Invalidate a specific entity from the cache.

## Parameters

### cache

An object with a `del` method (e.g., CacheService or metrics proxy).

#### del

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
