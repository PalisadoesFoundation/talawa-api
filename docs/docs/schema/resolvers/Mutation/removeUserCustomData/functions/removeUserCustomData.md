[**talawa-api**](../../../../README.md)

***

# Function: removeUserCustomData()

> **removeUserCustomData**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>\>

Removes custom data associated with the current user within a specified organization.

This function allows an authorized user, such as an organization admin or super admin, to remove custom data associated with the user within a specific organization. The function first verifies the user's identity and authorization, then proceeds to delete the custom data if it exists.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveUserCustomDataArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveUserCustomDataArgs.md), `"organizationId"`\>

The arguments passed to the GraphQL mutation, including the `organizationId` for which the custom data should be removed.

### context

`any`

Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`UserCustomData`](../../../../types/generatedGraphQLTypes/type-aliases/UserCustomData.md)\>\>

The removed custom data object if the operation was successful.

## Defined in

[src/resolvers/Mutation/removeUserCustomData.ts:30](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/removeUserCustomData.ts#L30)
