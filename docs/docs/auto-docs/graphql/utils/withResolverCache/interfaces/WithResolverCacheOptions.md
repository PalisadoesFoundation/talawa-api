[API Docs](/)

***

# Interface: WithResolverCacheOptions\<TParent, TArgs, TContext, _TResult\>

Defined in: src/graphql/utils/withResolverCache.ts:15

Options for wrapping a GraphQL resolver with caching.

## Type Param

The return type of the resolver.

## Type Parameters

### TParent

`TParent`

The parent/root type passed to the resolver.

### TArgs

`TArgs`

The arguments type for the resolver.

### TContext

`TContext` *extends* `object`

The GraphQL context type (must include `cache`).

### _TResult

`_TResult`

## Properties

### keyFactory()

> **keyFactory**: (`parent`, `args`, `context`) => `string`

Defined in: src/graphql/utils/withResolverCache.ts:30

Factory function to generate the cache key from resolver arguments.
Use `entityKey` or `listKey` from `~/src/services/caching` for consistent key generation.

#### Parameters

##### parent

`TParent`

The parent object passed to the resolver.

##### args

`TArgs`

The resolver arguments.

##### context

`TContext`

The GraphQL context.

#### Returns

`string`

A unique cache key string.

***

### logger?

> `optional` **logger**: [`CacheWrapperLogger`](../../../../services/caching/wrappers/interfaces/CacheWrapperLogger.md)

Defined in: src/graphql/utils/withResolverCache.ts:41

Optional logger for recording cache operation failures.

***

### metrics?

> `optional` **metrics**: [`CacheWrapperMetrics`](../../../../services/caching/wrappers/interfaces/CacheWrapperMetrics.md)

Defined in: src/graphql/utils/withResolverCache.ts:46

Optional metrics client for tracking cache operation failures.

***

### skip()?

> `optional` **skip**: (`parent`, `args`, `context`) => `boolean`

Defined in: src/graphql/utils/withResolverCache.ts:57

Optional callback to conditionally skip caching.
If this returns `true`, the cache is bypassed and the resolver is called directly.

#### Parameters

##### parent

`TParent`

The parent object passed to the resolver.

##### args

`TArgs`

The resolver arguments.

##### context

`TContext`

The GraphQL context.

#### Returns

`boolean`

`true` to skip caching, `false` to use cache.

***

### ttlSeconds

> **ttlSeconds**: `number`

Defined in: src/graphql/utils/withResolverCache.ts:36

Time-to-live in seconds for cached values.
Use `getTTL` from `~/src/services/caching` for consistent TTL per entity type.
