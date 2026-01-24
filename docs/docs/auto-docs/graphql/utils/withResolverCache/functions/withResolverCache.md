[**talawa-api**](../../../../README.md)

***

# Function: withResolverCache()

> **withResolverCache**\<`TParent`, `TArgs`, `TContext`, `TResult`\>(`options`, `resolver`): (`parent`, `args`, `context`) => `Promise`\<`TResult`\>

Defined in: [src/graphql/utils/withResolverCache.ts:96](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/utils/withResolverCache.ts#L96)

Wraps a GraphQL resolver with caching logic.

This higher-order function provides resolver-level caching by:
1. Computing a cache key using the provided `keyFactory`
2. Checking the cache for an existing value
3. On cache hit: returning the cached value immediately
4. On cache miss: executing the resolver, caching the result, and returning it

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

### TResult

`TResult`

The return type of the resolver.

## Parameters

### options

[`WithResolverCacheOptions`](../interfaces/WithResolverCacheOptions.md)\<`TParent`, `TArgs`, `TContext`, `TResult`\>

Configuration options for caching.

### resolver

(`parent`, `args`, `context`) => `Promise`\<`TResult`\>

The original resolver function to wrap.

## Returns

A wrapped resolver function with caching behavior.

> (`parent`, `args`, `context`): `Promise`\<`TResult`\>

### Parameters

#### parent

`TParent`

#### args

`TArgs`

#### context

`TContext`

### Returns

`Promise`\<`TResult`\>

## Example

```typescript
import { entityKey, getTTL } from "~/src/services/caching";
import { withResolverCache } from "~/src/graphql/utils/withResolverCache";

const resolve = withResolverCache(
  {
    keyFactory: (_p, args, _c) => entityKey("organization", args.id),
    ttlSeconds: getTTL("organization"),
  },
  async (_parent, args, ctx) => {
    return ctx.drizzleClient.query.organizationsTable.findFirst({
      where: (f, op) => op.eq(f.id, args.id),
    });
  },
);
```
