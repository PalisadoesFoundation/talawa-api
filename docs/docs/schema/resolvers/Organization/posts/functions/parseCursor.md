[**talawa-api**](../../../../README.md)

***

# Function: parseCursor()

> **parseCursor**(`__namedParameters`): [`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

Parses the cursor value for the `posts` connection resolver.

This function is used to parse the cursor value for the `posts` connection resolver.

## Parameters

### \_\_namedParameters

[`ParseGraphQLConnectionCursorArguments`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorArguments.md) & `object`

## Returns

[`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

An object containing the parsed cursor value or an array of errors if the cursor is invalid.

## See

 - Post - The Post model used to interact with the posts collection in the database.
 - ParseGraphQLConnectionCursorArguments - The type definition for the arguments of the parseCursor function.
 - ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.

## Defined in

[src/resolvers/Organization/posts.ts:125](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Organization/posts.ts#L125)
