[**talawa-api**](../../../../README.md)

***

# Function: getRecurringEvents()

> **getRecurringEvents**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

This query will fetch all the events with the same BaseRecurringEventId from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetRecurringEventsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetRecurringEventsArgs.md), `"baseRecurringEventId"`\>

An object that contains `baseRecurringEventId` of the base recurring event.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>[]\>

An array of `Event` objects that are instances of the base recurring event.

## Defined in

[src/resolvers/Query/getRecurringEvents.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getRecurringEvents.ts#L11)
