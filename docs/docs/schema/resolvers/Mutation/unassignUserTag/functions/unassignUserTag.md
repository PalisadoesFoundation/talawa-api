[**talawa-api**](../../../../README.md)

***

# Function: unassignUserTag()

> **unassignUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Unassigns a tag from a user in an organization.

This function removes a specific tag from a user in an organization.
It checks whether the current user has the necessary permissions to unassign the tag and
verifies if the tag and the user exist in the system. If the tag is not currently assigned
to the user, an error is thrown.

The function performs the following steps:
1. Attempts to find the current user in the cache or database.
2. Verifies if the current user exists.
3. Attempts to find the current user's profile in the cache or database.
4. Checks if the current user has the necessary permissions to unassign the tag.
5. Fetches the tag that needs to be unassigned.
6. Checks if the user to whom the tag is assigned exists.
7. Ensures that the tag is actually assigned to the user.
8. Removes the tag assignment from the user.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUnassignUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUnassignUserTagArgs.md), `"input"`\>

The arguments provided by the GraphQL query, specifically containing the user ID and tag ID to unassign.

### context

`any`

The context of the request, containing information about the currently authenticated user.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

The user from whom the tag was unassigned.

## Defined in

[src/resolvers/Mutation/unassignUserTag.ts:47](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/unassignUserTag.ts#L47)
