[**talawa-api**](../../../../README.md)

***

# Function: parseCursor()

> **parseCursor**(`args`): [`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

This function is used to validate and transform the cursor passed to the `posts` connection resolver.

## Parameters

### args

[`ParseGraphQLConnectionCursorArguments`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorArguments.md) & `object`

An object that includes the cursor value, cursor name, cursor path, and the ID of the creator.

## Returns

[`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

A Promise that resolves to an object that includes a boolean indicating whether the operation was successful, and the parsed cursor value. If the operation was not successful, the object also includes an array of errors.

## Throws

Error Throws an error if the provided cursor is invalid.

## Defined in

[src/resolvers/User/posts.ts:102](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/User/posts.ts#L102)
