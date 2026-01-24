[API Docs](/)

***

# Interface: WrapWithCacheOptions\<K, _V\>

Defined in: src/services/caching/wrappers.ts:21

Options for wrapping a batch function with caching.

## Type Parameters

### K

`K`

### _V

`_V`

## Properties

### cache

> **cache**: [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: src/services/caching/wrappers.ts:25

The cache service instance.

***

### entity

> **entity**: `string`

Defined in: src/services/caching/wrappers.ts:29

Entity type for cache key generation.

***

### keyFn()

> **keyFn**: (`key`) => `string` \| `number`

Defined in: src/services/caching/wrappers.ts:35

Function to convert a key to its cache key suffix.

#### Parameters

##### key

`K`

The batch key.

#### Returns

`string` \| `number`

String representation for the cache key.

***

### logger?

> `optional` **logger**: [`CacheWrapperLogger`](CacheWrapperLogger.md)

Defined in: src/services/caching/wrappers.ts:43

Optional logger for recording cache operation failures.

***

### metrics?

> `optional` **metrics**: [`CacheWrapperMetrics`](CacheWrapperMetrics.md)

Defined in: src/services/caching/wrappers.ts:47

Optional metrics client for tracking cache operation failures.

***

### ttlSeconds

> **ttlSeconds**: `number`

Defined in: src/services/caching/wrappers.ts:39

TTL in seconds for cached values.
