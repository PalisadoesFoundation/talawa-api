[**talawa-api**](../../../../README.md)

***

# Function: getEventAttendeesByEventId()

> **getEventAttendeesByEventId**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[]\>

Retrieves all attendees for a specific event from the database.

This function performs the following steps:
1. Queries the database to find all `EventAttendee` records that match the provided event ID.
2. Returns an array of attendee records for the specified event.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetEventAttendeesByEventIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetEventAttendeesByEventIdArgs.md), `"eventId"`\>

The arguments provided by the GraphQL query, including:
  - `eventId`: The ID of the event for which attendees are being retrieved.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>[]\>

An array of attendee records for the specified event.

## Defined in

[src/resolvers/Query/getEventAttendeesByEventId.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getEventAttendeesByEventId.ts#L16)
