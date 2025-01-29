[**talawa-api**](../../../../README.md)

***

# Function: getEventVolunteers()

> **getEventVolunteers**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>[]\>

This query will fetch all events volunteers for the given eventId from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetEventVolunteersArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetEventVolunteersArgs.md), `"where"`\>

An object that contains `id` of the Event.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>[]\>

An object that holds all Event Volunteers for the given Event

## Defined in

[src/resolvers/Query/getEventVolunteers.ts:13](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/getEventVolunteers.ts#L13)
