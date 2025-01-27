[**talawa-api**](../../../../README.md)

***

# Function: getDonationByOrgIdConnection()

> **getDonationByOrgIdConnection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[]\>

Retrieves a paginated list of donations associated with a specific organization from the database.

This function performs the following steps:
1. Constructs a query filter using the provided criteria and organization ID.
2. Queries the database for donations that match the criteria and belong to the specified organization.
3. Applies pagination by limiting and skipping the results based on the provided arguments.
4. Returns the list of donations that match the query.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetDonationByOrgIdConnectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetDonationByOrgIdConnectionArgs.md), `"orgId"`\>

The arguments provided by the GraphQL query, including:
  - `orgId`: The ID of the organization for which donations are being retrieved.
  - `where`: Optional filter criteria to apply to the donations.
  - `first`: The maximum number of donation records to return (for pagination).
  - `skip`: The number of donation records to skip (for pagination).

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceDonation`](../../../../models/Donation/interfaces/InterfaceDonation.md)\>[]\>

A list of donations associated with the specified organization and matching the provided filter criteria.

## Defined in

[src/resolvers/Query/getDonationByOrgIdConnection.ts:24](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/getDonationByOrgIdConnection.ts#L24)
