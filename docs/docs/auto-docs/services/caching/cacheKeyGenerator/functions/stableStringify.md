[API Docs](/)

***

# Function: stableStringify()

> **stableStringify**(`obj`): `string`

Defined in: [src/services/caching/cacheKeyGenerator.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/cacheKeyGenerator.ts#L27)

Deterministic JSON stringification for cache key generation.
Sorts object keys to ensure consistent output regardless of insertion order.

## Parameters

### obj

`unknown`

The object to stringify.

## Returns

`string`

Deterministic JSON string.
