[Admin Docs](/)

***

# Type Alias: ParseGraphQLConnectionCursorResult\<T0\>

> **ParseGraphQLConnectionCursorResult**\<`T0`\>: `Promise`\<\{ `errors`: [`DefaultGraphQLArgumentError`](../../type-aliases/DefaultGraphQLArgumentError.md)[]; `isSuccessful`: `false`; \} \| \{ `isSuccessful`: `true`; `parsedCursor`: `T0`; \}\>

This is typescript type of object returned from the callback function `parseCursor` passed
as an argument to `parseGraphQLConnectionArguments`, `parseGraphQLConnectionArgumentsWithSortedBy`,
`parseGraphQLConnectionArgumentsWithWhere` and `parseGraphQLConnectionArgumentsWithSortedByAndWhere`
functions.

## Type Parameters

• **T0**

## Defined in

[src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts:25](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/graphQLConnection/parseGraphQLConnectionArguments.ts#L25)
