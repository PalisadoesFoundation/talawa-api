[API Docs](/)

***

# Interface: WithQueryMetricsOptions\<_TParent, _TArgs, _TContext, _TResult\>

Defined in: [src/graphql/utils/withQueryMetrics.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withQueryMetrics.ts#L11)

Options for wrapping a GraphQL query resolver with performance tracking.

## Type Param

The parent/root type passed to the resolver.

## Type Param

The arguments type for the resolver.

## Type Param

The GraphQL context type (must include optional `perf`).

## Type Param

The return type of the resolver.

## Type Parameters

### _TParent

`_TParent`

### _TArgs

`_TArgs`

### _TContext

`_TContext` *extends* `object`

### _TResult

`_TResult`

## Properties

### operationName

> **operationName**: `string`

Defined in: [src/graphql/utils/withQueryMetrics.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/withQueryMetrics.ts#L21)

Name of the query operation for performance tracking.
Should follow the pattern: `query:{queryName}` (e.g., `query:user`, `query:organizations`).
