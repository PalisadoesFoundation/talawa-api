[API Docs](/)

***

# Interface: WrapWithCacheOptions\<K, _V\>

Defined in: [src/services/caching/wrappers.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L7)

Options for wrapping a batch function with caching.

## Type Parameters

### K

`K`

### _V

`_V`

## Properties

### cache

> **cache**: [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: [src/services/caching/wrappers.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L11)

The cache service instance.

***

### entity

> **entity**: `string`

Defined in: [src/services/caching/wrappers.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L15)

Entity type for cache key generation.

***

### keyFn()

> **keyFn**: (`key`) => `string` \| `number`

Defined in: [src/services/caching/wrappers.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L21)

Function to convert a key to its cache key suffix.

#### Parameters

##### key

`K`

The batch key.

#### Returns

`string` \| `number`

String representation for the cache key.

***

### ttlSeconds

> **ttlSeconds**: `number`

Defined in: [src/services/caching/wrappers.ts:25](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L25)

TTL in seconds for cached values.
