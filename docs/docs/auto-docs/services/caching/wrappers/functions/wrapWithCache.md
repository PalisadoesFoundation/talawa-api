[**talawa-api**](../../../../README.md)

***

# Function: wrapWithCache()

> **wrapWithCache**\<`K`, `V`\>(`batchFn`, `opts`): (`keys`) => `Promise`\<(`V` \| `null`)[]\>

Defined in: [src/services/caching/wrappers.ts:69](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L69)

Wraps a batch function with caching support.
Ideal for integrating with DataLoader to add a cache layer.

## Type Parameters

### K

`K`

### V

`V`

## Parameters

### batchFn

(`keys`) => `Promise`\<(`V` \| `null`)[]\>

The original batch function that fetches data.

### opts

[`WrapWithCacheOptions`](../interfaces/WrapWithCacheOptions.md)\<`K`, `V`\>

Caching options.

## Returns

A wrapped batch function that checks cache first.

> (`keys`): `Promise`\<(`V` \| `null`)[]\>

### Parameters

#### keys

readonly `K`[]

### Returns

`Promise`\<(`V` \| `null`)[]\>

## Example

```typescript
const cachedBatch = wrapWithCache(batchFn, {
  cache: ctx.cache,
  entity: "user",
  keyFn: (id) => id,
  ttlSeconds: 300,
});
return new DataLoader(cachedBatch);
```
