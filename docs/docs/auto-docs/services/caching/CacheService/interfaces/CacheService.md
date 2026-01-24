[API Docs](/)

***

# Interface: CacheService

Defined in: src/services/caching/CacheService.ts:5

Abstract interface for cache operations.
Implementations should handle serialization/deserialization and graceful degradation.

## Methods

### clearByPattern()

> **clearByPattern**(`pattern`): `Promise`\<`void`\>

Defined in: src/services/caching/CacheService.ts:32

Delete all keys matching a glob pattern.
Uses SCAN internally to avoid blocking Redis.

#### Parameters

##### pattern

`string`

Glob pattern (e.g., "talawa:v1:user:list:*").

#### Returns

`Promise`\<`void`\>

***

### del()

> **del**(`keys`): `Promise`\<`void`\>

Defined in: src/services/caching/CacheService.ts:25

Delete one or more keys from the cache.

#### Parameters

##### keys

Single key or array of keys to delete.

`string` | `string`[]

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Defined in: src/services/caching/CacheService.ts:11

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

***

### mget()

> **mget**\<`T`\>(`keys`): `Promise`\<(`T` \| `null`)[]\>

Defined in: src/services/caching/CacheService.ts:39

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

***

### mset()

> **mset**\<`T`\>(`entries`): `Promise`\<`void`\>

Defined in: src/services/caching/CacheService.ts:45

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

***

### set()

> **set**\<`T`\>(`key`, `value`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: src/services/caching/CacheService.ts:19

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
