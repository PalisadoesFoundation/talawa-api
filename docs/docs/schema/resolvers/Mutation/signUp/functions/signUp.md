[**talawa-api**](../../../../README.md)

***

# Function: signUp()

> **signUp**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

This function enables sign up.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationSignUpArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationSignUpArgs.md), `"data"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

Sign up details.

## Defined in

[src/resolvers/Mutation/signUp.ts:33](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/signUp.ts#L33)
