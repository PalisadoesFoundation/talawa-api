[**talawa-api**](../../../../README.md)

***

# Function: creator()

> **creator**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Resolver function for the `creator` field of a `Post`.

This function retrieves the user who created a specific post.

## Parameters

### parent

[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)

The parent object representing the post. It contains information about the post, including the ID of the user who created it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

A promise that resolves to the user document found in the database. This document represents the user who created the post.

## See

 - User - The User model used to interact with the users collection in the database.
 - PostResolvers - The type definition for the resolvers of the Post fields.

## Defined in

[src/resolvers/Post/creator.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Post/creator.ts#L16)
