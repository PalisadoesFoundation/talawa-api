[**talawa-api**](../../../../README.md)

***

# Function: removeUserTag()

> **removeUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Removes a user tag from an organization.

This function removes a specific tag associated with a user in an organization.
It checks whether the user has the proper authorization to delete the tag.
It also handles cases where the user or the tag is not found in the system.

The function performs the following steps:
1. Attempts to find the user in the cache or database.
2. Verifies if the user exists.
3. Attempts to find the user's profile in the cache or database.
4. Checks if the user has the necessary permissions to delete the tag.
5. Fetches the tag that needs to be deleted.
6. Retrieves all child tags (including the parent tag) related to the organization.
7. Deletes all related tags from the organization and user tag entries.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveUserTagArgs.md), `"id"`\>

The arguments provided by the GraphQL query, specifically containing the ID of the tag to be removed.

### context

`any`

The context of the request, containing information about the currently authenticated user.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

The tag that was deleted.

## Defined in

[src/resolvers/Mutation/removeUserTag.ts:43](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/removeUserTag.ts#L43)
