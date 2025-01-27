[**talawa-api**](../../../../README.md)

***

# Function: childTags()

> **childTags**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `childTags` field of a `UserTag`.

This resolver is used to resolve the `childTags` field of a `UserTag` type.

## Parameters

### parent

[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.

### args

`Partial`\<[`UserTagChildTagsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagChildTagsArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the child tags.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the child tags of the user tag.

## See

 - OrganizationTagUser - The OrganizationTagUser model used to interact with the organization tag users collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of child tags into a connection object.
 - getGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of child tags that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - UserTagResolvers - The type definition for the resolvers of the UserTag fields.

## Defined in

[src/resolvers/UserTag/childTags.ts:40](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/UserTag/childTags.ts#L40)
