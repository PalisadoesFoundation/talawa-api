[Admin Docs](/)

***

# Function: registerForEvent()

> **registerForEvent**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

Enables a user to register for an event.

This resolver function allows a user to register for a specific event.
It performs the necessary checks to ensure that the user exists, the event exists,
and that the user has not already registered for the event.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRegisterForEventArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRegisterForEventArgs.md), `"id"`\>

The payload provided with the request, including the ID of the event to register for.

### context

`any`

The context of the entire application, containing user authentication and request information.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

The updated event object after registration.

## Throws

NotFoundError if the specified event is not found.

## Throws

InputValidationError if the current user is already registered for the event.

## Remarks

The function performs the following checks:
1. Checks if the event exists.
2. Checks if the current user has already registered for the event.
If the user is invited, their registration status is updated. Otherwise, a new entry is created in the EventAttendee collection.

## Defined in

[src/resolvers/Mutation/registerForEvent.ts:35](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/registerForEvent.ts#L35)
