[API Docs](/)

***

# Function: withQueryMetrics()

> **withQueryMetrics**\<`TParent`, `TArgs`, `TContext`, `TResult`\>(`options`, `resolver`): (`parent`, `args`, `context`) => `Promise`\<`TResult`\>

Defined in: [src/graphql/utils/withQueryMetrics.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withQueryMetrics.ts#L57)

Wraps a GraphQL query resolver with performance tracking instrumentation.

This higher-order function provides automatic performance tracking by:
1. Wrapping the resolver execution with `ctx.perf?.time()` if performance tracker is available
2. Gracefully degrading to direct resolver execution if performance tracker is unavailable
3. Ensuring metrics are collected even on query errors (via try/finally pattern in perf.time)

## Type Parameters

### TParent

`TParent`

The parent/root type passed to the resolver.

### TArgs

`TArgs`

The arguments type for the resolver.

### TContext

`TContext` *extends* `object`

The GraphQL context type (must include optional `perf`).

### TResult

`TResult`

The return type of the resolver.

## Parameters

### options

[`WithQueryMetricsOptions`](../interfaces/WithQueryMetricsOptions.md)\<`TParent`, `TArgs`, `TContext`, `TResult`\>

Configuration options for performance tracking.

### resolver

(`parent`, `args`, `context`) => `Promise`\<`TResult`\>

The original resolver function to wrap.

## Returns

A wrapped resolver function with performance tracking behavior.

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
import { withQueryMetrics } from "~/src/graphql/utils/withQueryMetrics";

const resolve = withQueryMetrics(
  {
    operationName: "query:user",
  },
  async (_parent, args, ctx) => {
    return ctx.drizzleClient.query.usersTable.findFirst({
      where: (f, op) => op.eq(f.id, args.input.id),
    });
  },
);
```
