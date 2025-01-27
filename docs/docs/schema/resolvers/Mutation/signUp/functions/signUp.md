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

[src/resolvers/Mutation/signUp.ts:33](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/signUp.ts#L33)
