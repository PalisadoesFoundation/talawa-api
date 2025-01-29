[**talawa-api**](../../../../README.md)

***

# Function: checkIn()

> **checkIn**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCheckIn`](../../../../models/CheckIn/interfaces/InterfaceCheckIn.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCheckIn`](../../../../models/CheckIn/interfaces/InterfaceCheckIn.md)\>\>

Handles the check-in process for event attendees.

This resolver function allows event admins or superadmins to check-in attendees for a specific event.
It verifies the existence of the current user, the event, and the attendee to be checked in,
and ensures proper authorization before performing the check-in operation.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCheckInArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCheckInArgs.md), `"data"`\>

Arguments containing data for the check-in, including the eventId, userId.

### context

`any`

Context object containing user authentication and request information.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCheckIn`](../../../../models/CheckIn/interfaces/InterfaceCheckIn.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCheckIn`](../../../../models/CheckIn/interfaces/InterfaceCheckIn.md)\>\>

The check-in data if successful.

## Throws

NotFoundError if the current user, event, or attendee is not found.

## Throws

UnauthorizedError if the current user lacks authorization to perform the check-in operation.

## Throws

ConflictError if the attendee is already checked in for the event.

## Remarks

The function performs the following checks and operations:
1. Verifies the existence of the current user, event, and attendee.
2. Checks if the current user is authorized to perform the check-in operation.
3. Checks if the attendee is already registered for the event. If so, updates the check-in status and isCheckedIn.
4. Checks if the attendee is not already checked in for the event then creates a new check-in entry and create new eventAttendee with chechInId and isCheckedIn.

## Defined in

[src/resolvers/Mutation/checkIn.ts:50](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/checkIn.ts#L50)
