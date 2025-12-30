[API Docs](/)

***

# Interface: WrapWithCacheOptions\<K, _V\>

Defined in: [src/services/caching/wrappers.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L6)

Options for wrapping a batch function with caching.

## Type Parameters

### K

`K`

### _V

`_V`

## Properties

### cache

> **cache**: [`CacheService`](../../CacheService/interfaces/CacheService.md)

Defined in: [src/services/caching/wrappers.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L10)

The cache service instance.

***

### entity

> **entity**: `string`

Defined in: [src/services/caching/wrappers.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L14)

Entity type for cache key generation.

***

### keyFn()

> **keyFn**: (`key`) => `string` \| `number`

Defined in: [src/services/caching/wrappers.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L20)

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

Defined in: [src/services/caching/wrappers.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/wrappers.ts#L24)

TTL in seconds for cached values.
