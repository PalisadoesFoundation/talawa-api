[**talawa-api**](../../../../README.md)

***

# Function: blockPluginCreationBySuperadmin()

> **blockPluginCreationBySuperadmin**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAppUserProfile`](../../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAppUserProfile`](../../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\>\>

Allows a superadmin to enable or disable plugin creation for a specific user.

This function performs several checks:

1. Verifies if the current user exists.
2. Ensures that the current user has an associated app user profile.
3. Confirms that the current user is a superadmin.
4. Checks if the target user exists and updates their `pluginCreationAllowed` field based on the provided value.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationBlockPluginCreationBySuperadminArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationBlockPluginCreationBySuperadminArgs.md), `"userId"` \| `"blockUser"`\>

The arguments provided with the request, including:
  - `userId`: The ID of the user whose plugin creation permissions are being modified.
  - `blockUser`: A boolean indicating whether to block (`true`) or allow (`false`) plugin creation for the user.

### context

`any`

The context of the entire application, including user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAppUserProfile`](../../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAppUserProfile`](../../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)\>\>

A promise that resolves to the updated user app profile object with the new `pluginCreationAllowed` value.

## Defined in

[src/resolvers/Mutation/blockPluginCreationBySuperadmin.ts:34](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/blockPluginCreationBySuperadmin.ts#L34)
