[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PratapRathi/talawa-api/blob/72aae1e3507e4dd8ad32a69696c05d569e0ed095/src/utilities/defaultGraphQLConnection.ts#L67)

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
