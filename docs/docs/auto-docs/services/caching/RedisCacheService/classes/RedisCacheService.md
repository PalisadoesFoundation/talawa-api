[**talawa-api**](../../../../README.md)

***

# Class: RedisCacheService

Defined in: [src/services/caching/RedisCacheService.ts:40](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L40)

Redis-backed implementation of CacheService.
All operations are wrapped with try/catch for graceful degradation.

## Implements

- [`CacheService`](../../CacheService/interfaces/CacheService.md)

## Constructors

### Constructor

> **new RedisCacheService**(`redis`, `logger`): `RedisCacheService`

Defined in: [src/services/caching/RedisCacheService.ts:41](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L41)

#### Parameters

##### redis

`RedisLike`

##### logger

`Logger`

#### Returns

`RedisCacheService`

## Methods

### clearByPattern()

> **clearByPattern**(`pattern`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:76](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L76)

Delete all keys matching a glob pattern.
Uses SCAN internally to avoid blocking Redis.

#### Parameters

##### pattern

`string`

Glob pattern (e.g., "talawa:v1:user:list:*").

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`clearByPattern`](../../CacheService/interfaces/CacheService.md#clearbypattern)

***

### del()

> **del**(`keys`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:65](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L65)

Delete one or more keys from the cache.

#### Parameters

##### keys

Single key or array of keys to delete.

`string` | `string`[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`del`](../../CacheService/interfaces/CacheService.md#del)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Defined in: [src/services/caching/RedisCacheService.ts:46](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L46)

Retrieve a cached value by key.

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

The cache key to retrieve.

#### Returns

`Promise`\<`T` \| `null`\>

The cached value or null if not found/expired.

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`get`](../../CacheService/interfaces/CacheService.md#get)

***

### mget()

> **mget**\<`T`\>(`keys`): `Promise`\<(`T` \| `null`)[]\>

Defined in: [src/services/caching/RedisCacheService.ts:98](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L98)

Batch get multiple keys.

#### Type Parameters

##### T

`T`

#### Parameters

##### keys

`string`[]

Array of cache keys.

#### Returns

`Promise`\<(`T` \| `null`)[]\>

Array of values in the same order as keys (null for missing).

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`mget`](../../CacheService/interfaces/CacheService.md#mget)

***

### mset()

> **mset**\<`T`\>(`entries`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:118](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L118)

Batch set multiple key-value pairs with TTLs.

#### Type Parameters

##### T

`T`

#### Parameters

##### entries

`object`[]

Array of `{ key, value, ttlSeconds }` objects.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`mset`](../../CacheService/interfaces/CacheService.md#mset)

***

### set()

> **set**\<`T`\>(`key`, `value`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:56](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/caching/RedisCacheService.ts#L56)

Store a value in the cache with a TTL.

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

The cache key.

##### value

`T`

The value to cache (will be JSON serialized).

##### ttlSeconds

`number`

Time-to-live in seconds.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`set`](../../CacheService/interfaces/CacheService.md#set)
