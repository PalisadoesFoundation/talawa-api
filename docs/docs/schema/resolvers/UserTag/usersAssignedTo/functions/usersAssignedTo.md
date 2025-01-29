[**talawa-api**](../../../../README.md)

***

# Function: usersAssignedTo()

> **usersAssignedTo**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `usersAssignedTo` field of a `UserTag`.

This resolver is used to resolve the `usersAssignedTo` field of a `UserTag` type.

## Parameters

### parent

[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.

### args

`Partial`\<[`UserTagUsersAssignedToArgs`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagUsersAssignedToArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the users assigned to the user tag.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the users assigned to the user tag.

## See

 - TagUser - The TagUser model used to interact with the tag users collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of users assigned to the user tag into a connection object.
 - getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of users that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - UserTagResolvers - The type definition for the resolvers of the UserTag fields.

## Defined in

[src/resolvers/UserTag/usersAssignedTo.ts:40](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/UserTag/usersAssignedTo.ts#L40)
