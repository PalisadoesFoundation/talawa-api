[**talawa-api**](../../../../README.md)

***

# Function: createUserFamily()

> **createUserFamily**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

Creates a new user family and associates users with it.

This function performs the following actions:
1. Verifies the existence of the current user and retrieves their details and application profile.
2. Checks if the current user is a super admin.
3. Validates the user family name to ensure it does not exceed 256 characters.
4. Ensures that the user family has at least two members.
5. Creates the user family and associates it with the provided users.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateUserFamilyArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateUserFamilyArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.title`: The title of the user family (must be a string with a maximum length of 256 characters).
  - `data.userIds`: An array of user IDs to be included in the user family (must contain at least 2 members).

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user creating the user family.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

The created user family object.

## See

 - User - The User model used to interact with user data in the database.
 - AppUserProfile - The AppUserProfile model used to interact with user profile data in the database.
 - UserFamily - The UserFamily model used to interact with user family data in the database.
 - superAdminCheck - A utility function to check if the user is a super admin.

## Defined in

[src/resolvers/Mutation/createUserFamily.ts:45](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/createUserFamily.ts#L45)
