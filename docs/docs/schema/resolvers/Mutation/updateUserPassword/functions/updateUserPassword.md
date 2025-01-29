[**talawa-api**](../../../../README.md)

***

# Function: updateUserPassword()

> **updateUserPassword**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

Updates the password for the currently authenticated user.

This function allows the current user to update their password. It performs the following steps:
1. Retrieves the current user from the cache or database.
2. Verifies the current user exists.
3. Retrieves the current user's profile from the cache or database.
4. Checks if the current user is authorized to update the password.
5. Validates the previous password provided by the user.
6. Ensures the new password and confirmation match.
7. Hashes the new password and updates it in the database.
8. Clears the user's token and updates their profile.
9. Updates the user and profile caches.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateUserPasswordArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateUserPasswordArgs.md), `"data"`\>

The arguments provided by the GraphQL query, including the previous password, new password, and password confirmation.

### context

`any`

The context of the request, containing information about the currently authenticated user.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

An object containing the updated user and their profile.

## Defined in

[src/resolvers/Mutation/updateUserPassword.ts:39](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/updateUserPassword.ts#L39)
