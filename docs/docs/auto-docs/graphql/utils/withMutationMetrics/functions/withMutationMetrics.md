[API Docs](/)

***

# Function: withMutationMetrics()

> **withMutationMetrics**\<`TArgs`, `TResult`\>(`mutationName`, `resolver`, `ctx`, `_args`, `_parent`): `Promise`\<`TResult`\>

Defined in: [src/graphql/utils/withMutationMetrics.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withMutationMetrics.ts#L32)

Wraps a mutation resolver with performance tracking instrumentation.
This helper utility provides consistent mutation instrumentation across the codebase
and reduces boilerplate when adding performance tracking to mutations.

## Type Parameters

### TArgs

`TArgs`

### TResult

`TResult`

## Parameters

### mutationName

`string`

The name of the mutation (e.g., "createUser", "updateOrganization").
  This will be used as the operation name in the format: `mutation:{mutationName}`

### resolver

() => `Promise`\<`TResult`\>

The mutation resolver function to wrap with performance tracking

### ctx

[`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing the optional performance tracker

### \_args

`TArgs`

### \_parent

`unknown`

## Returns

`Promise`\<`TResult`\>

The result of the resolver function

## Example

```typescript
resolve: async (_parent, args, ctx) => {
  return withMutationMetrics("createUser", async () => {
    // Mutation logic here
    return result;
  }, ctx, args, _parent);
}
```

## Remarks

- If `ctx.perf` is not available, the resolver executes without tracking (graceful degradation)
- The operation name follows the pattern: `mutation:{mutationName}`
- Metrics are collected even if the mutation fails (errors are propagated)
- This helper is optional - some mutations may need custom tracking logic
