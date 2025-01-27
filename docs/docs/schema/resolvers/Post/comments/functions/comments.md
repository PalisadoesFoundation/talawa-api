[**talawa-api**](../../../../README.md)

***

# Function: comments()

> **comments**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>[]\>

Resolver function for the `comments` field of a `Post`.

This function retrieves the comments associated with a specific post.

## Parameters

### parent

[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)

The parent object representing the post. It contains information about the post, including the ID of the comments associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceComment`](../../../../models/Comment/interfaces/InterfaceComment.md)\>[]\>

A promise that resolves to an array of comment documents found in the database. These documents represent the comments associated with the post.

## See

 - Comment - The Comment model used to interact with the comments collection in the database.
 - PostResolvers - The type definition for the resolvers of the Post fields.

## Defined in

[src/resolvers/Post/comments.ts:18](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Post/comments.ts#L18)
