[**talawa-api**](../../../../README.md)

***

# Function: usersToAssignTo()

> **usersToAssignTo**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `usersToAssignTo` field of a `UserTag`.

## Parameters

### parent

[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.

### args

`Partial`\<[`UserTagUsersToAssignToArgs`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagUsersToAssignToArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the users assigned to the user tag.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UsersConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UsersConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the users assigned to the user tag.

## See

 - User - The User model used to interact with the users collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of users assigned to the user tag into a connection object.
 - getGraphQLConnectionFilter - The function used to get the filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of users that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - UserResolvers - The type definition for the resolvers of the UserTag fields.

## Defined in

[src/resolvers/UserTag/usersToAssignTo.ts:41](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/UserTag/usersToAssignTo.ts#L41)
