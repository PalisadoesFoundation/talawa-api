[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/PratapRathi/talawa-api/blob/8547a42c99c7a44be459745d0018a2deccfb1f66/src/utilities/defaultGraphQLConnection.ts#L163)

Transform function for connection arguments with a where clause.
Extends the base transformation with where handling.

## Type Parameters

• **Arg** *extends* `object` & `object`

• **Where** = `Arg`\[`"where"`\]

## Parameters

### arg

`Arg`

The arguments to transform

### ctx

`RefinementCtx`

The Zod refinement context

## Returns

`object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\> & `object`

The transformed arguments with where clause
