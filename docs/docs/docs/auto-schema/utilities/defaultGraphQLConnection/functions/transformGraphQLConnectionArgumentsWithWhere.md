[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/defaultGraphQLConnection.ts#L163)

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
