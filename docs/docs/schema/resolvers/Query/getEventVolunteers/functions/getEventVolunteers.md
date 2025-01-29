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

[src/resolvers/Query/getEventVolunteers.ts:13](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getEventVolunteers.ts#L13)
