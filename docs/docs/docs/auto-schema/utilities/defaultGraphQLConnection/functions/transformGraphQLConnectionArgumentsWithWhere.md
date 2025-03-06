[Admin Docs](/)

***

# Function: transformGraphQLConnectionArgumentsWithWhere()

> **transformGraphQLConnectionArgumentsWithWhere**\<`Arg`, `Where`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\> & `object`

Defined in: [src/utilities/defaultGraphQLConnection.ts:163](https://github.com/PurnenduMIshra129th/talawa-api/blob/4369c9351f5b76f958b297b25ab2b17196210af9/src/utilities/defaultGraphQLConnection.ts#L163)

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
