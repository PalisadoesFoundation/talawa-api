[API Docs](/)

***

# Function: metricsCacheProxy()

> **metricsCacheProxy**\<`TCache`\>(`cache`, `perf`): `object`

Defined in: [src/services/metrics/metricsCacheProxy.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCacheProxy.ts#L24)

Creates a cache proxy that wraps a cache implementation with performance tracking capabilities.

This function instruments cache operations (get, mget, set, del) to track cache hits and misses
through a performance monitoring object.

## Type Parameters

### TCache

`TCache` *extends* `object`

The cache object type that must implement get, set, del methods and optionally mget

## Parameters

### cache

`TCache`

The cache implementation object with get, set, del methods and optional mget method

### perf

`any`

Performance tracker object with trackCacheHit() and trackCacheMiss() methods

## Returns

`object`

A proxy object with the following methods:

### del()

> **del**(`keys`): `Promise`\<`any`\>

#### Parameters

##### keys

`string` | `string`[]

#### Returns

`Promise`\<`any`\>

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`T` \| `null`\>

### mget()

> **mget**\<`T`\>(`keys`): `Promise`\<(`T` \| `null`)[]\>

#### Type Parameters

##### T

`T`

#### Parameters

##### keys

`string`[]

#### Returns

`Promise`\<(`T` \| `null`)[]\>

### set()

> **set**\<`T`\>(`key`, `value`, `ttl`): `Promise`\<`any`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### ttl

`number`

#### Returns

`Promise`\<`any`\>

## Example

```typescript
const proxiedCache = metricsCacheProxy(redisCache, performanceTracker);
const value = await proxiedCache.get('myKey');
```
