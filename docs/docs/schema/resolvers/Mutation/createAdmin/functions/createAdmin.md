[**talawa-api**](../../../../README.md)

***

# Function: createAdmin()

> **createAdmin**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdminPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdminPayload.md), `"user"` \| `"userErrors"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdminPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdminPayload.md), `"user"` \| `"userErrors"`\> & `object`\>\>

Creates an admin for an organization by adding the specified user to the organization's admin list.

This function performs several checks:

1. Verifies if the specified organization exists.
2. Ensures the current user is found and has an associated app user profile.
3. Checks if the current user is the creator of the organization.
4. Checks if the specified user exists and is a member of the organization.
5. Ensures the specified user is not already an admin of the organization.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateAdminArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateAdminArgs.md), `"data"`\>

The arguments provided with the request, including:
  - `data`: An object containing:
    - `organizationId`: The ID of the organization to which the user will be added as an admin.
    - `userId`: The ID of the user to be made an admin.

### context

`any`

The context of the entire application, including user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdminPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdminPayload.md), `"user"` \| `"userErrors"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdminPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdminPayload.md), `"user"` \| `"userErrors"`\> & `object`\>\>

An object containing:
  - `user`: The updated app user profile of the user being added as an admin.
  - `userErrors`: An array of error objects if any errors occurred, otherwise an empty array.

## Remarks

The function handles the following:
- Caches and retrieves the organization data.
- Verifies the existence and profile of the current user.
- Ensures the user to be added is a member of the organization and is not already an admin.
- Updates the organization's admin list and the app user profile of the newly added admin.

## Defined in

[src/resolvers/Mutation/createAdmin.ts:47](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createAdmin.ts#L47)
