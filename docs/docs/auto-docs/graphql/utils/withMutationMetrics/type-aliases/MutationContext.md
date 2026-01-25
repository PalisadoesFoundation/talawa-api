[API Docs](/)

***

# Type Alias: MutationContext

> **MutationContext** = `Pick`\<[`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md), `"perf"`\>

Defined in: [src/graphql/utils/withMutationMetrics.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withMutationMetrics.ts#L8)

Context type containing an optional performance tracker.
Used for mutation instrumentation with graceful degradation.
Accepts GraphQLContext or any object with optional perf property.
