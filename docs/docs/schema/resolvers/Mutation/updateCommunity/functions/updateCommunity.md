[**talawa-api**](../../../../README.md)

***

# Function: updateCommunity()

> **updateCommunity**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

This function enables to upload Pre login imagery.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateCommunityArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateCommunityArgs.md), `"data"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

Boolean.

## Remarks

The following checks are done:
1. If the user exists.
2. If the user is super admin.

## Defined in

[src/resolvers/Mutation/updateCommunity.ts:27](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updateCommunity.ts#L27)
