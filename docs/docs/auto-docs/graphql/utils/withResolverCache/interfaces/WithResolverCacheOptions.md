[API Docs](/)

***

# Interface: WithResolverCacheOptions\<TParent, TArgs, TContext, _TResult\>

Defined in: src/graphql/utils/withResolverCache.ts:11

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

Defined in: src/graphql/utils/withResolverCache.ts:26

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

### skip()?

> `optional` **skip**: (`parent`, `args`, `context`) => `boolean`

Defined in: src/graphql/utils/withResolverCache.ts:43

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

Defined in: src/graphql/utils/withResolverCache.ts:32

Time-to-live in seconds for cached values.
Use `getTTL` from `~/src/services/caching` for consistent TTL per entity type.
