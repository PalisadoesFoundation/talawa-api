[**talawa-api**](../../../../README.md)

***

# Function: event()

> **event**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

Resolver function for the `event` field of a `CheckIn`.

This function retrieves the event associated with a specific check-in.

## Parameters

### parent

[`InterfaceCheckIn`](../../../../models/CheckIn/interfaces/InterfaceCheckIn.md)

The parent object representing the check-in. It contains information about the check-in, including the ID of the event attendee it is associated with.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

A promise that resolves to the event document found in the database. This document represents the event associated with the check-in.

## See

 - EventAttendee - The EventAttendee model used to interact with the event attendees collection in the database.
 - CheckInResolvers - The type definition for the resolvers of the CheckIn fields.

## Defined in

[src/resolvers/CheckIn/event.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/CheckIn/event.ts#L16)
