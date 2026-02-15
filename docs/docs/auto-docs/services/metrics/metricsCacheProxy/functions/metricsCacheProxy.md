[API Docs](/)

***

# Function: metricsCacheProxy()

> **metricsCacheProxy**\<`TCache`\>(`cache`, `perf`): `object`

Defined in: [src/services/metrics/metricsCacheProxy.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/metrics/metricsCacheProxy.ts#L7)

Creates a cache proxy that wraps a cache implementation with performance tracking capabilities.

This function instruments cache operations (`get`, `mget`, `set`, `del`) to track cache hits
and misses using a performance monitoring object.

## Type Parameters

### TCache

`TCache` *extends* `object`

## Parameters

### cache

`TCache`

### perf

#### trackCacheHit

() => `void`

#### trackCacheMiss

() => `void`

## Returns

### clearByPattern()

> **clearByPattern**(`pattern`): `Promise`\<`unknown`\>

Clear all keys matching a pattern. Forwarded without metrics.

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`unknown`\>

### del()

> **del**(`keys`): `Promise`\<`unknown`\>

Delete one or more keys from cache.

#### Parameters

##### keys

`string` | `string`[]

#### Returns

`Promise`\<`unknown`\>

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Get a single value from cache.
- Normalizes undefined → null
- Tracks hit/miss correctly

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

Get multiple values from cache.
- Works with or without native mget
- Normalizes undefined → null per element
- Tracks hits/misses in a single pass

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

Set a value in cache.

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
