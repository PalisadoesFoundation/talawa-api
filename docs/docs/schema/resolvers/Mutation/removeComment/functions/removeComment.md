[**talawa-api**](../../../../README.md)

***

# Function: removeComment()

> **removeComment**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

This function enables to remove a comment.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveCommentArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveCommentArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

Deleted comment.

## Remarks

The following checks are done:
1. If the user exists
2. If the comment exists.
3. If the user is the creator of the organization.
4. If the user has appUserProfile

## Defined in

[src/resolvers/Mutation/removeComment.ts:36](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/removeComment.ts#L36)
