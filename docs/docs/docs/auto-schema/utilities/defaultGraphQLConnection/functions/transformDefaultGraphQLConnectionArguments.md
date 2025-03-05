[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PalisadoesFoundation/talawa-api/blob/36e30b39ce897bdded5fea4859d9ae00485b5a4c/src/utilities/defaultGraphQLConnection.ts#L67)

Transform function for the basic connection arguments.

## Type Parameters

• **Arg** *extends* `object`

## Parameters

### arg

`Arg`

### ctx

`RefinementCtx`

## Returns

`object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\>
