[**talawa-api**](../../../../README.md)

***

# Function: eventsByOrganization()

> **eventsByOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

This query will fetch all the events for an organization from the database.

## Parameters

### parent

### args

`Partial`\<[`QueryEventsByOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryEventsByOrganizationArgs.md)\>

An object that contains `orderBy` to sort the object as specified and `id` of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

An `events` object that holds all the events for the Organization.

## Defined in

[src/resolvers/Query/eventsByOrganization.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/eventsByOrganization.ts#L10)
