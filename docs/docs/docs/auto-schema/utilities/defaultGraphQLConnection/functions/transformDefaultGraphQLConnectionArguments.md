[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/utilities/defaultGraphQLConnection.ts#L67)

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
