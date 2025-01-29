[**talawa-api**](../../../../README.md)

***

# Function: saveFcmToken()

> **saveFcmToken**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

This function enables to save Fcm Token.

## Parameters

### parent

### args

`Partial`\<[`MutationSaveFcmTokenArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationSaveFcmTokenArgs.md)\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

True if operation is successful.

## Remarks

The following checks are done:
1. If the user exists.

## Defined in

[src/resolvers/Mutation/saveFcmToken.ts:12](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/saveFcmToken.ts#L12)
