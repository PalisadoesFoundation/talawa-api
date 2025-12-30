[API Docs](/)

***

# Function: listKey()

> **listKey**(`entity`, `args`): `string`

Defined in: src/services/caching/cacheKeyGenerator.ts:57

Generate a cache key for a list query with arguments.
Uses SHA1 hash of arguments for a compact, deterministic key.

## Parameters

### entity

`string`

The entity type.

### args

`unknown`

Query arguments (filters, pagination, etc.).

## Returns

`string`

Cache key in format: `talawa:v1:${entity}:list:${hash}`.

## Example

```typescript
listKey("organization", { limit: 10, offset: 0 }) // "talawa:v1:organization:list:a1b2c3..."
```
