[**talawa-api**](../../../../README.md)

***

# Function: createComment()

> **createComment**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

Creates a new comment and associates it with the specified post.

This function performs the following actions:
1. Verifies that the post specified by `postId` exists.
2. Creates a new comment associated with the post.
3. Increments the `commentCount` for the post by 1.
4. Caches the newly created comment and updated post data.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateCommentArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateCommentArgs.md), `"data"` \| `"postId"`\>

The arguments for the mutation, including:
  - `postId`: The ID of the post to which the comment will be associated.
  - `data`: The comment data, including the content of the comment.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user creating the comment.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>\>

The created comment.

## Defined in

[src/resolvers/Mutation/createComment.ts:27](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/createComment.ts#L27)
