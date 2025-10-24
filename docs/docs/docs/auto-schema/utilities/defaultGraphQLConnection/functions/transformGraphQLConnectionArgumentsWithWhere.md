[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"first"` \| `"last"` \| `"before"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/defaultGraphQLConnection.ts#L163)

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
