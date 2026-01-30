[API Docs](/)

***

# Function: withMutationMetrics()

> **withMutationMetrics**\<`TParent`, `TArgs`, `TContext`, `TResult`\>(`options`, `resolver`): (`parent`, `args`, `context`) => `Promise`\<`TResult`\>

Defined in: [src/graphql/utils/withMutationMetrics.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withMutationMetrics.ts#L51)

Wraps a GraphQL mutation resolver with performance tracking instrumentation.

This higher-order function provides automatic performance tracking by:
1. Wrapping the resolver execution with `ctx.perf?.time()` if performance tracker is available
2. Gracefully degrading to direct resolver execution if performance tracker is unavailable
3. Ensuring metrics are collected even on mutation errors (via try/finally pattern in perf.time)

Scope: This utility only adds resolver-level mutation timing. It does not implement
request-scoped wiring, Server-Timing headers, aggregation workers, metrics endpoint,
or DataLoader/cache instrumentation; those are documented in the performance-monitoring
docs and may be tracked separately.

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

[`WithMutationMetricsOptions`](../interfaces/WithMutationMetricsOptions.md)

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
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";

const resolve = withMutationMetrics(
  {
    operationName: "mutation:createUser",
  },
  async (_parent, args, ctx) => {
    // Mutation logic here
    return result;
  },
);
```
