[**talawa-api**](../../../../README.md)

***

# Function: getUserTag()

> **getUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Retrieves a user tag by its ID.

This function fetches a specific user tag from the database using its ID. If the user tag
is not found, it throws an error indicating that the item does not exist.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetUserTagArgs.md), `"id"`\>

The arguments provided by the GraphQL query, including the ID of the user tag to retrieve.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

The user tag with the specified ID.

## Defined in

[src/resolvers/Query/getUserTag.ts:18](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getUserTag.ts#L18)
