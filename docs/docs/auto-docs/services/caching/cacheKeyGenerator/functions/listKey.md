[**talawa-api**](../../../../README.md)

***

# Function: listKey()

> **listKey**(`entity`, `args`): `string`

Defined in: [src/services/caching/cacheKeyGenerator.ts:88](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/cacheKeyGenerator.ts#L88)

Generate a cache key for a list query with arguments.

Uses SHA-1 hash for compact, deterministic keys. SHA-1 is chosen for
performance and compactness (40-char hex digest), not for cryptographic
security. The hash is derived from stableStringify output, which ensures
deterministic ordering of object properties. If stronger hashing is needed
for future security concerns, SHA-256 can be substituted.

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
