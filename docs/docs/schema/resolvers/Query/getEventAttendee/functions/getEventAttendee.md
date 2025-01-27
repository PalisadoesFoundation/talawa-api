[**talawa-api**](../../../../README.md)

***

# Function: getEventAttendee()

> **getEventAttendee**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

Retrieves an attendee record for a specific event and user from the database.

This function performs the following steps:
1. Queries the database to find an `EventAttendee` record that matches the provided event ID and user ID.
2. Returns the found attendee record, or `null` if no matching record is found.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetEventAttendeeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetEventAttendeeArgs.md), `"userId"` \| `"eventId"`\>

The arguments provided by the GraphQL query, including:
  - `eventId`: The ID of the event for which the attendee is being retrieved.
  - `userId`: The ID of the user for whom the attendee record is being retrieved.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

The attendee record for the specified event and user, or `null` if no record is found.

## Defined in

[src/resolvers/Query/getEventAttendee.ts:19](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/getEventAttendee.ts#L19)
