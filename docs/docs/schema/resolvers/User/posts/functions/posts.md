[**talawa-api**](../../../../README.md)

***

# Function: posts()

> **posts**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\>\>

Resolver function to fetch and return posts created by a user from the database.
This function implements cursor-based pagination using GraphQL connection arguments.

## Parameters

### parent

[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)

An object that is the return value of the resolver for this field's parent.

### args

`Partial`\<[`UserPostsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/UserPostsArgs.md)\>

Arguments passed to the resolver. These should include pagination arguments such as `first`, `last`, `before`, and `after`.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\>\>

A Promise that resolves to an object containing an array of posts, the total count of posts, and pagination information. The pagination information includes the `startCursor`, `endCursor`, `hasPreviousPage`, and `hasNextPage`.

## Throws

GraphQLError Throws an error if the provided arguments are invalid.

## Defined in

[src/resolvers/User/posts.ts:30](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/User/posts.ts#L30)
