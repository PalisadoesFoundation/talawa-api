[**talawa-api**](../../../../README.md)

***

# Function: parseCursor()

> **parseCursor**(`__namedParameters`): [`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

Parses the cursor value for the `usersAssignedTo` connection resolver.

This function is used to parse the cursor value provided to the `usersAssignedTo` connection resolver.

## Parameters

### \_\_namedParameters

[`ParseGraphQLConnectionCursorArguments`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorArguments.md) & `object`

## Returns

[`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

An object containing the parsed cursor value or an array of errors if the cursor value is invalid.

## See

 - TagUser - The TagUser model used to interact with the tag users collection in the database.
 - DefaultGraphQLArgumentError - The type definition for the default GraphQL argument error.
 - ParseGraphQLConnectionCursorArguments - The type definition for the arguments provided to the parseCursor function.
 - ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.

## Defined in

[src/resolvers/UserTag/usersAssignedTo.ts:195](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/UserTag/usersAssignedTo.ts#L195)
