[**talawa-api**](../../../../README.md)

***

# Function: login()

> **login**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

This function enables login. (note: only works when using the last resort SuperAdmin credentials)

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationLoginArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationLoginArgs.md), `"data"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AuthData`](../../../../types/generatedGraphQLTypes/type-aliases/AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

Updated user

## Remarks

The following checks are done:
1. If the user exists
2. If the password is valid

## Defined in

[src/resolvers/Mutation/login.ts:25](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/login.ts#L25)
