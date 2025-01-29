[Admin Docs](/)

***

# Function: parseCursor()

> **parseCursor**(`__namedParameters`): [`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

Parses the cursor value for the `userTags` connection resolver.

This function is used to parse the cursor value for the `userTags` connection resolver.

## Parameters

### \_\_namedParameters

[`ParseGraphQLConnectionCursorArguments`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorArguments.md) & `object`

## Returns

[`ParseGraphQLConnectionCursorResult`](../../../../utilities/graphQLConnection/parseGraphQLConnectionArguments/type-aliases/ParseGraphQLConnectionCursorResult.md)\<`string`\>

An object containing the parsed cursor value or an array of errors if the cursor is invalid.

## See

 - OrganizationTagUser - The OrganizationTagUser model used to interact with the user tags collection in the database.
 - DefaultGraphQLArgumentError - The type definition for the default GraphQL argument error.
 - ParseGraphQLConnectionCursorArguments - The type definition for the arguments of the parseCursor function.
 - ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.

## Defined in

[src/resolvers/Organization/userTags.ts:148](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Organization/userTags.ts#L148)
