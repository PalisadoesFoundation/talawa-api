[**talawa-api**](../../../../README.md)

***

# Function: refreshToken()

> **refreshToken**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`ExtendSession`](../../../../types/generatedGraphQLTypes/type-aliases/ExtendSession.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`ExtendSession`](../../../../types/generatedGraphQLTypes/type-aliases/ExtendSession.md)\>\>

This function creates a new access and refresh token.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRefreshTokenArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRefreshTokenArgs.md), `"refreshToken"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`ExtendSession`](../../../../types/generatedGraphQLTypes/type-aliases/ExtendSession.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`ExtendSession`](../../../../types/generatedGraphQLTypes/type-aliases/ExtendSession.md)\>\>

New access and refresh tokens.

## Defined in

[src/resolvers/Mutation/refreshToken.ts:25](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/refreshToken.ts#L25)
