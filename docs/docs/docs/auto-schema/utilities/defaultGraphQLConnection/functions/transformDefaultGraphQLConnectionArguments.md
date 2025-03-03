[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"after"` \| `"before"` \| `"first"` \| `"last"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PalisadoesFoundation/talawa-api/blob/4f56a5331bd7a5f784e82913103662f37b427f3e/src/utilities/defaultGraphQLConnection.ts#L67)

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
