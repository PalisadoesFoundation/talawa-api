[**talawa-api**](../../../../README.md)

***

# Function: eventsByOrganizationConnection()

> **eventsByOrganizationConnection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

Retrieves events for a specific organization based on the provided query parameters.

This function performs the following steps:
1. Generates recurring event instances up to a certain date if the organization has any.
2. Builds a query filter (`where`) and sorting parameters based on the provided arguments.
3. Queries the database for events matching the filter, with sorting, pagination, and related data fetching.

## Parameters

### parent

### args

`Partial`\<[`QueryEventsByOrganizationConnectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryEventsByOrganizationConnectionArgs.md)\>

The arguments provided by the GraphQL query, including filters (`where`), sorting order (`orderBy`), pagination options (`first` and `skip`), and any other query parameters.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

A list of events matching the query parameters, with related data populated.

## Defined in

[src/resolvers/Query/eventsByOrganizationConnection.ts:22](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/eventsByOrganizationConnection.ts#L22)
