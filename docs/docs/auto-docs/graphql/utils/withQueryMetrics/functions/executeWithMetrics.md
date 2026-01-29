[API Docs](/)

***

# Function: executeWithMetrics()

> **executeWithMetrics**\<`TContext`, `TResult`\>(`context`, `operationName`, `resolver`): `Promise`\<`TResult`\>

Defined in: [src/graphql/utils/withQueryMetrics.ts:103](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withQueryMetrics.ts#L103)

Executes a resolver function with performance tracking (inline utility).

This utility provides inline performance tracking by:
1. Executing the resolver with `ctx.perf.time()` if performance tracker is available
2. Gracefully degrading to direct resolver execution if performance tracker is unavailable

Unlike `withQueryMetrics` (a higher-order function), this executes immediately.

## Type Parameters

### TContext

`TContext` *extends* `object`

### TResult

`TResult`

## Parameters

### context

`TContext`

The GraphQL context with optional perf tracker.

### operationName

`string`

Name of the operation for metrics (e.g., "query:event").

### resolver

() => `Promise`\<`TResult`\>

The resolver function to execute.

## Returns

`Promise`\<`TResult`\>

The result of the resolver execution.

## Example

```typescript
return await executeWithMetrics(ctx, "query:event", resolver);
```
