[Admin Docs](/)

***

# Type Alias: DirectiveResolverFn()\<TResult, TParent, TContext, TArgs\>

> **DirectiveResolverFn**\<`TResult`, `TParent`, `TContext`, `TArgs`\>: (`next`, `parent`, `args`, `context`, `info`?) => `TResult` \| `Promise`\<`TResult`\>

## Type Parameters

• **TResult** = \{\}

• **TParent** = \{\}

• **TContext** = \{\}

• **TArgs** = \{\}

## Parameters

### next

[`NextResolverFn`](NextResolverFn.md)\<`TResult`\>

### parent

`TParent`

### args

`TArgs`

### context

`TContext`

### info?

`GraphQLResolveInfo`

## Returns

`TResult` \| `Promise`\<`TResult`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:3479](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L3479)
