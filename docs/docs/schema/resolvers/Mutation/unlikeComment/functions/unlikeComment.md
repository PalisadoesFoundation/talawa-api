[**talawa-api**](../../../../README.md)

***

# Function: unlikeComment()

> **unlikeComment**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

This function enables to unlike a comment.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUnlikeCommentArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUnlikeCommentArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

Comment.

## Remarks

The following checks are done:
1. If the user exists.
2. If the comment exists

## Defined in

[src/resolvers/Mutation/unlikeComment.ts:17](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/unlikeComment.ts#L17)
