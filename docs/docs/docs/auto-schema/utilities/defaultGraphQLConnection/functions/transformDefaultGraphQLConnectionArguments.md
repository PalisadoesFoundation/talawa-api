[Admin Docs](/)

***

# Function: transformDefaultGraphQLConnectionArguments()

> **transformDefaultGraphQLConnectionArguments**\<`Arg`\>(`arg`, `ctx`): `object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:67](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/defaultGraphQLConnection.ts#L67)

Transform function for the basic connection arguments.

## Type Parameters

### Arg

`Arg` *extends* `object`

## Parameters

### arg

`Arg`

### ctx

`RefinementCtx`

## Returns

`object` & `Omit`\<`Arg`, `"first"` \| `"last"` \| `"before"` \| `"after"`\>
