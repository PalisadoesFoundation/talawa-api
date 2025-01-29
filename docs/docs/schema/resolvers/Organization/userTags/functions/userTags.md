[Admin Docs](/)

***

# Function: userTags()

> **userTags**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `userTags` field of an `Organization`.

This resolver is used to resolve the `userTags` field of an `Organization` type.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

`Partial`\<[`OrganizationUserTagsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationUserTagsArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the user tags.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserTagsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserTagsConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the user tags of the organization.

## See

 - OrganizationTagUser - The OrganizationTagUser model used to interact with the user tags collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of user tags into a connection object.
 - getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of user tags that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/userTags.ts:40](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Organization/userTags.ts#L40)
