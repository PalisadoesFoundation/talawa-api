[API Docs](/)

***

# Function: entityKey()

> **entityKey**(`entity`, `id`): `string`

Defined in: [src/services/caching/cacheKeyGenerator.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/cacheKeyGenerator.ts#L16)

Generate a cache key for a specific entity by ID.

## Parameters

### entity

`string`

The entity type (e.g., "user", "organization").

### id

The entity ID.

`string` | `number`

## Returns

`string`

Cache key in format: `talawa:v1:${entity}:${id}`.

## Example

```typescript
entityKey("user", "abc123") // "talawa:v1:user:abc123"
```
