[**talawa-api**](../../../../README.md)

***

# Function: tagsAssignedWith()

> **tagsAssignedWith**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `tagsAssignedWith` field of a `User`.

This resolver is used to resolve the `tagsAssignedWith` field of a `User` type.

## Parameters

### parent

[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)

The parent object representing the user. It contains information about the user, including the ID of the user.

### args

`Partial`\<[`UserTagsAssignedWithArgs`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsAssignedWithArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the tags assigned to the user.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the tags assigned to the user.

## See

 - TagUser - The TagUser model used to interact with the tag users collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of tags assigned to the user into a connection object.
 - getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of users that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - UserTagResolvers - The type definition for the resolvers of the User fields.

## Defined in

[src/resolvers/User/tagsAssignedWith.ts:39](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/User/tagsAssignedWith.ts#L39)
