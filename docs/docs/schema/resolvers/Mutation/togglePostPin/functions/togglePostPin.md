[**talawa-api**](../../../../README.md)

***

# Function: togglePostPin()

> **togglePostPin**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

Toggles the pinning status of a post within an organization.

This function allows an authorized user, such as an organization admin or super admin, to pin or unpin a post within an organization. If the post is already pinned, it will be unpinned, and if it is not pinned, it will be pinned. The function ensures that only authorized users can perform this action and that the title provided for pinning meets validation requirements.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationTogglePostPinArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationTogglePostPinArgs.md), `"id"`\>

The arguments passed to the GraphQL mutation, including the post's `id` and optionally the `title` to be used if pinning the post.

### context

`any`

Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

The updated post object after the pinning status has been toggled.

## Defined in

[src/resolvers/Mutation/togglePostPin.ts:40](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/togglePostPin.ts#L40)
