[**talawa-api**](../../../../README.md)

***

# Function: user()

> **user**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

This query fetch the user from the database.

This function ensure that users can only query their own data and not access details of other users , protecting sensitive data.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryUserArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryUserArgs.md), `"id"`\>

An object that contains `id` for the user.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

An object that contains user data. If the user is not found then it throws a `NotFoundError` error.

## Defined in

[src/resolvers/Query/user.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/user.ts#L17)
