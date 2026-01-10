[API Docs](/)

***

# Class: RedisCacheService

Defined in: [src/services/caching/RedisCacheService.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L40)

Redis-backed implementation of CacheService.
All operations are wrapped with try/catch for graceful degradation.

## Implements

- [`CacheService`](../../CacheService/interfaces/CacheService.md)

## Constructors

### Constructor

> **new RedisCacheService**(`redis`, `logger`): `RedisCacheService`

Defined in: [src/services/caching/RedisCacheService.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L41)

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

Defined in: [src/services/caching/RedisCacheService.ts:123](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L123)

Delete all keys matching a glob pattern.
Uses SCAN internally to avoid blocking Redis with the KEYS command.

#### Parameters

##### pattern

`string`

Glob pattern (e.g., "talawa:v1:user:list:*").

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
await cache.clearByPattern('talawa:v1:organization:list:*');
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`clearByPattern`](../../CacheService/interfaces/CacheService.md#clearbypattern)

***

### del()

> **del**(`keys`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:101](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L101)

Delete one or more keys from the cache.

#### Parameters

##### keys

Single key or array of keys to delete.

`string` | `string`[]

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
await cache.del('talawa:v1:user:123');
await cache.del(['key1', 'key2', 'key3']);
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`del`](../../CacheService/interfaces/CacheService.md#del)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Defined in: [src/services/caching/RedisCacheService.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L58)

Retrieve a cached value by key.

#### Type Parameters

##### T

`T`

The expected type of the cached value.

#### Parameters

##### key

`string`

The cache key to retrieve.

#### Returns

`Promise`\<`T` \| `null`\>

The cached value deserialized from JSON, or null if not found/expired/invalid.

#### Example

```typescript
const user = await cache.get<User>('talawa:v1:user:123');
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`get`](../../CacheService/interfaces/CacheService.md#get)

***

### mget()

> **mget**\<`T`\>(`keys`): `Promise`\<(`T` \| `null`)[]\>

Defined in: [src/services/caching/RedisCacheService.ts:157](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L157)

Batch get multiple keys.

#### Type Parameters

##### T

`T`

The expected type of the cached values.

#### Parameters

##### keys

`string`[]

Array of cache keys.

#### Returns

`Promise`\<(`T` \| `null`)[]\>

Array of values in the same order as keys (null for missing/invalid).

#### Example

```typescript
const users = await cache.mget<User>(['user:1', 'user:2', 'user:3']);
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`mget`](../../CacheService/interfaces/CacheService.md#mget)

***

### mset()

> **mset**\<`T`\>(`entries`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:192](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L192)

Batch set multiple key-value pairs with TTLs.
Uses Promise.allSettled to persist successful entries even if some fail.

#### Type Parameters

##### T

`T`

The type of the values to cache.

#### Parameters

##### entries

`object`[]

Array of `{ key, value, ttlSeconds }` objects.

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
await cache.mset([
  { key: 'user:1', value: user1, ttlSeconds: 300 },
  { key: 'user:2', value: user2, ttlSeconds: 300 },
]);
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`mset`](../../CacheService/interfaces/CacheService.md#mset)

***

### set()

> **set**\<`T`\>(`key`, `value`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: [src/services/caching/RedisCacheService.ts:81](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/RedisCacheService.ts#L81)

Store a value in the cache with a TTL.

#### Type Parameters

##### T

`T`

The type of the value to cache.

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

#### Example

```typescript
await cache.set('talawa:v1:user:123', userData, 300);
```

#### Implementation of

[`CacheService`](../../CacheService/interfaces/CacheService.md).[`set`](../../CacheService/interfaces/CacheService.md#set)
