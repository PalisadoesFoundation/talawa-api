[**talawa-api**](../../../../README.md)

***

# Function: advertisements()

> **advertisements**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\>\>

Resolver function for the `advertisements` field of an `Organization`.

This resolver is used to resolve the `advertisements` field of an `Organization` type.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

`Partial`\<[`OrganizationAdvertisementsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/OrganizationAdvertisementsArgs.md)\>

The arguments provided to the field. These arguments are used to filter, sort, and paginate the advertisements.

### context

`any`

The context object passed to the GraphQL resolvers. It contains the API root URL, which is used to construct the media URL for each advertisement.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\>\>

A promise that resolves to a connection object containing the advertisements of the organization.

## See

 - Advertisement - The Advertisement model used to interact with the advertisements collection in the database.
 - parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 - transformToDefaultGraphQLConnection - The function used to transform the list of advertisements into a connection object.
 - getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 - getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 - MAXIMUM_FETCH_LIMIT - The maximum number of advertisements that can be fetched in a single request.
 - GraphQLError - The error class used to throw GraphQL errors.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/advertisements.ts:38](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Organization/advertisements.ts#L38)
