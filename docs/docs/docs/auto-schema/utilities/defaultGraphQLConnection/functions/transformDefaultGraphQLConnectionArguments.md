[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PratapRathi/talawa-api/blob/8547a42c99c7a44be459745d0018a2deccfb1f66/src/utilities/defaultGraphQLConnection.ts#L67)

Transform function for the basic connection arguments.

## Type Parameters

• **Arg** *extends* `object`

## Parameters

### arg

`Arg`

### ctx

`RefinementCtx`

## Returns

`object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\>
