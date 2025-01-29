[Admin Docs](/)

***

# Function: attendeesCheckInStatus()

> **attendeesCheckInStatus**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CheckInStatus`](../../../../types/generatedGraphQLTypes/type-aliases/CheckInStatus.md), `"user"` \| `"checkIn"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CheckInStatus`](../../../../types/generatedGraphQLTypes/type-aliases/CheckInStatus.md), `"user"` \| `"checkIn"`\> & `object`\>[]\>

Resolver function for the `attendeesCheckInStatus` field of an `Event`.

This function retrieves the attendees of an event and their check-in status.

## Parameters

### parent

[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)

The parent object representing the event. It contains information about the event, including the ID.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CheckInStatus`](../../../../types/generatedGraphQLTypes/type-aliases/CheckInStatus.md), `"user"` \| `"checkIn"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CheckInStatus`](../../../../types/generatedGraphQLTypes/type-aliases/CheckInStatus.md), `"user"` \| `"checkIn"`\> & `object`\>[]\>

A promise that resolves to an array of objects. Each object contains information about an attendee of the event, including the user document and the check-in document.

## See

 - EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 - EventResolvers - The type definition for the resolvers of the Event fields.

## Defined in

[src/resolvers/Event/attendeesCheckInStatus.ts:16](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Event/attendeesCheckInStatus.ts#L16)
