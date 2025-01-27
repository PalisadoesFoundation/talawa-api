[**talawa-api**](../../../../README.md)

***

# Function: fundsByOrganization()

> **fundsByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[]\>

Retrieves funds associated with a specific organization based on the provided query parameters.

This function performs the following steps:
1. Builds a query filter (`where`) and sorting parameters based on the provided arguments.
2. Queries the database for funds associated with the specified organization ID and matching the filter criteria.
3. Sorts the results based on the provided sorting order.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryFundsByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryFundsByOrganizationArgs.md), `"organizationId"`\>

The arguments provided by the GraphQL query, including the organization ID (`organizationId`), filter criteria (`where`), and sorting order (`orderBy`).

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>[]\>

A list of funds associated with the specified organization, matching the filter and sorting criteria.

## Defined in

[src/resolvers/Query/fundsByOrganization.ts:20](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/fundsByOrganization.ts#L20)
