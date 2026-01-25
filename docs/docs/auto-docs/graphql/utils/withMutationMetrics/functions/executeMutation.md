[API Docs](/)

***

# Function: executeMutation()

> **executeMutation**\<`T`\>(`mutationName`, `ctx`, `fn`): `Promise`\<`T`\>

Defined in: [src/graphql/utils/withMutationMetrics.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withMutationMetrics.ts#L33)

Executes a mutation with performance tracking.

This utility wraps mutation resolver logic with performance tracking,
recording the total execution time under the operation name `mutation:{mutationName}`.
If no performance tracker is available, the mutation executes without tracking.

## Type Parameters

### T

`T`

## Parameters

### mutationName

`string`

Name of the mutation (e.g., "createUser", "deleteOrganization")

### ctx

[`MutationContext`](../type-aliases/MutationContext.md)

GraphQL context containing an optional perf tracker

### fn

() => `Promise`\<`T`\>

Async function containing the mutation logic

## Returns

`Promise`\<`T`\>

Promise resolving to the result of the mutation function

## Example

```typescript
// Inside a mutation resolver
resolve: async (_parent, args, ctx) => {
  return executeMutation("createUser", ctx, async () => {
    // ... mutation logic ...
    return result;
  });
}
```
