[**talawa-api**](../../../../README.md)

***

# Function: addUserToUserFamily()

> **addUserToUserFamily**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

Adds a user to a user family.

This function allows an admin to add a user to a specific user family. It performs several checks:

1. Verifies if the user family exists.
2. Checks if the user exists.
3. Confirms that the user is not already a member of the family.
4. Ensures that the current user is an admin of the user family.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddUserToUserFamilyArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddUserToUserFamilyArgs.md), `"userId"` \| `"familyId"`\>

The arguments provided with the request, including:
  - `familyId`: The ID of the user family to which the user will be added.
  - `userId`: The ID of the user to be added to the user family.

### context

`any`

The context of the entire application, including user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

A promise that resolves to the updated user family object.

## Defined in

[src/resolvers/Mutation/addUserToUserFamily.ts:36](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/addUserToUserFamily.ts#L36)
