[**talawa-api**](../../../../README.md)

***

# Interface: WrapWithCacheOptions\<K, _V\>

Defined in: [src/services/caching/wrappers.ts:21](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L21)

Options for wrapping a batch function with caching.

## Type Parameters

### K

`K`

### _V

`_V`

## Properties

### cache

> **cache**: [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: [src/services/caching/wrappers.ts:25](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L25)

The cache service instance.

***

### entity

> **entity**: `string`

Defined in: [src/services/caching/wrappers.ts:29](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L29)

Entity type for cache key generation.

***

### keyFn()

> **keyFn**: (`key`) => `string` \| `number`

Defined in: [src/services/caching/wrappers.ts:35](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L35)

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

Defined in: [src/services/caching/wrappers.ts:43](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L43)

Optional logger for recording cache operation failures.

***

### metrics?

> `optional` **metrics**: [`CacheWrapperMetrics`](CacheWrapperMetrics.md)

Defined in: [src/services/caching/wrappers.ts:47](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L47)

Optional metrics client for tracking cache operation failures.

***

### ttlSeconds

> **ttlSeconds**: `number`

Defined in: [src/services/caching/wrappers.ts:39](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/wrappers.ts#L39)

TTL in seconds for cached values.
