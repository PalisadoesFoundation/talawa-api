[**talawa-api**](../../../../README.md)

***

# Function: posts()

> **posts**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `posts` field of an `Organization`.

This resolver is used to resolve the `posts` field of an `Organization` type.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

`Partial`\<[`OrganizationPostsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationPostsArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the posts.

### context

`any`

The context object passed to the GraphQL resolvers. It contains the API root URL, which is used to construct the media URL for each post.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`PostsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/PostsConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the posts of the organization.

## See

 - Post - The Post model used to interact with the posts collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of posts into a connection object.
 - getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of posts that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/posts.ts:39](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Organization/posts.ts#L39)
