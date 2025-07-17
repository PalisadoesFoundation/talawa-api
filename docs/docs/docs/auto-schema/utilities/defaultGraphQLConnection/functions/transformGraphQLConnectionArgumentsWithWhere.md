[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/defaultGraphQLConnection.ts#L163)

Transform function for connection arguments with a where clause.
Extends the base transformation with where handling.

## Type Parameters

### Arg

`Arg` *extends* `object` & `object`

### Where

`Where` = `Arg`\[`"where"`\]

## Parameters

### arg

`Arg`

The arguments to transform

### ctx

`RefinementCtx`

The Zod refinement context

## Returns

The transformed arguments with where clause
