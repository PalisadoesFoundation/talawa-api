[**talawa-api**](../../../../README.md)

***

# Function: parseCursor()

> **parseCursor**(`__namedParameters`): [`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

Validates and transforms the cursor passed to the connection resolver.

This function checks if the provided cursor value corresponds to a valid advertisement in the database. If the cursor is valid, it is returned as-is. Otherwise, an error is recorded.

## Parameters

### \_\_namedParameters

[`ParseGraphQLConnectionCursorArguments`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorArguments.md)

## Returns

[`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

An object containing a flag indicating success or failure, the parsed cursor, and any errors encountered during validation.

## Defined in

[src/resolvers/Query/advertisementsConnection.ts:105](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/advertisementsConnection.ts#L105)
