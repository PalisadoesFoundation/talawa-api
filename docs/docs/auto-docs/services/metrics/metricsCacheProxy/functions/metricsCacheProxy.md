[API Docs](/)

***

# Function: metricsCacheProxy()

> **metricsCacheProxy**\<`TCache`\>(`cache`, `perf`): `object`

Defined in: [src/services/metrics/metricsCacheProxy.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCacheProxy.ts#L22)

Creates a cache proxy that wraps a cache implementation with performance tracking capabilities.

This function instruments cache operations (`get`, `mget`, `set`, `del`) to track cache hits
and misses using a performance monitoring object.

## Type Parameters

### TCache

`TCache` *extends* `object`

## Parameters

### cache

`TCache`

Cache implementation providing `get`, `set`, `del`, and optional `mget`

### perf

Performance tracker with `trackCacheHit` and `trackCacheMiss` methods

#### trackCacheHit

() => `void`

#### trackCacheMiss

() => `void`

## Returns

`object`

A proxy object exposing the following async methods:
- `get(key)` – Retrieves a single value and tracks hit or miss
- `mget(keys)` – Retrieves multiple values and tracks hits and misses
- `set(key, value, ttl)` – Stores a value with TTL
- `del(keys)` – Deletes one or more keys

### del()

> **del**(`keys`): `Promise`\<`unknown`\>

#### Parameters

##### keys

`string` | `string`[]

#### Returns

`Promise`\<`unknown`\>

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

> **set**\<`T`\>(`key`, `value`, `ttl`): `Promise`\<`unknown`\>

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

`Promise`\<`unknown`\>

## Example

```ts
const proxiedCache = metricsCacheProxy(redisCache, performanceTracker);
const value = await proxiedCache.get('myKey');
```
