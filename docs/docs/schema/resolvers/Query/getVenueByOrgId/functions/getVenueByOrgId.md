[**talawa-api**](../../../../README.md)

***

# Function: getVenueByOrgId()

> **getVenueByOrgId**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[]\>

Retrieves venues associated with a specific organization, with optional filtering and sorting.

This function performs the following steps:
1. Constructs the query filter using the `getWhere` helper function based on provided filter criteria.
2. Determines the sorting order using the `getSort` helper function based on provided sort criteria.
3. Queries the `Venue` collection in the database to find venues that match the specified organization ID and any additional filter criteria.
4. Limits the number of results based on the `first` argument and skips results based on the `skip` argument.
5. Sorts the results according to the specified sort criteria.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetVenueByOrgIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetVenueByOrgIdArgs.md), `"orgId"`\>

The arguments provided by the GraphQL query, including:
  - `orgId`: The ID of the organization for which venues are being retrieved.
  - `where`: Optional filter criteria to apply to the venue query.
  - `orderBy`: Optional sorting criteria for the results.
  - `first`: Optional limit on the number of results to return.
  - `skip`: Optional number of results to skip for pagination.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[]\>

A promise that resolves to an array of venues matching the query criteria.

## Defined in

[src/resolvers/Query/getVenueByOrgId.ts:27](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/getVenueByOrgId.ts#L27)
