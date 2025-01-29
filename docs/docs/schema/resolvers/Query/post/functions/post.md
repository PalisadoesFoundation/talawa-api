[**talawa-api**](../../../../README.md)

***

# Function: post()

> **post**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

This query will fetch the specified Post from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryPostArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryPostArgs.md), `"id"`\>

An object that contains `id` of the Post.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

An object `post`. If the `appLanguageCode` field not found then it throws a `NotFoundError` error.

## Defined in

[src/resolvers/Query/post.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/post.ts#L11)
