[Admin Docs](/)

***

# Type Alias: ParseGraphQLConnectionArgumentsResult\<T0\>

> **ParseGraphQLConnectionArgumentsResult**\<`T0`\>: \{ `errors`: [`DefaultGraphQLArgumentError`](../../type-aliases/DefaultGraphQLArgumentError.md)[]; `isSuccessful`: `false`; \} \| \{ `isSuccessful`: `true`; `parsedArgs`: [`ParsedGraphQLConnectionArguments`](ParsedGraphQLConnectionArguments.md)\<`T0`\>; \}

This is typescript type of the object returned from `parseGraphQLConnectionArguments`
function.

## Type Parameters

• **T0**

## Defined in

[src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts:57](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts#L57)
