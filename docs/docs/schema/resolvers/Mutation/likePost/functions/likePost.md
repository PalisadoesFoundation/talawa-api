[**talawa-api**](../../../../README.md)

***

# Function: likePost()

> **likePost**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

This function enables to like a post.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationLikePostArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationLikePostArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

Post without the like

## Remarks

The following checks are done:
1. If the user exists
2. If the post exists
3. If the user has already liked the post.

## Defined in

[src/resolvers/Mutation/likePost.ts:18](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/likePost.ts#L18)
