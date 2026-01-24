[**talawa-api**](../../../../README.md)

***

# Function: stableStringify()

> **stableStringify**(`obj`): `string`

Defined in: [src/services/caching/cacheKeyGenerator.ts:53](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/cacheKeyGenerator.ts#L53)

Deterministic JSON stringification for cache key generation.
Sorts object keys to ensure consistent output regardless of insertion order.

**Note on undefined properties**: Properties with undefined values are
omitted by JSON.stringify (standard behavior). This means `{a:1,b:undefined}`
serializes identically to `{a:1}`. Callers should be aware of this potential
cache key collision if undefined properties are semantically significant.

## Parameters

### obj

`unknown`

The object to stringify.

## Returns

`string`

Deterministic JSON string.
