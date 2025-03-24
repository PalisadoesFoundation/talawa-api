[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/NishantSinghhhhh/talawa-api/blob/c589e7bc1eb842c2fd40f1d8b61882c5c36978fe/src/utilities/defaultGraphQLConnection.ts#L163)

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

`object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\> & `object`

The transformed arguments with where clause
