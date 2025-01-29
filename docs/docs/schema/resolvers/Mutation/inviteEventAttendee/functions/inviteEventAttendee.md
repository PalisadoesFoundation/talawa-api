[Admin Docs](/)

***

# Function: inviteEventAttendee()

> **inviteEventAttendee**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

Invites an attendee to an event.

This resolver function facilitates the invitation process for an attendee to participate in an event.
It ensures the current user's authorization, validates the existence of the event, and manages the invitation status
to prevent duplicate invitations.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationInviteEventAttendeeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationInviteEventAttendeeArgs.md), `"data"`\>

Arguments containing data for the invitation, including the eventId and userId.

### context

`any`

Context object providing information about the current user.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventAttendee`](../../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)\>\>

Promise resolving to the invited user data.

## Throws

NotFoundError if the user or event is not found.

## Throws

UnauthorizedError if the current user lacks authorization to invite attendees.

## Throws

ConflictError if the user is already invited to the event.

## Defined in

[src/resolvers/Mutation/inviteEventAttendee.ts:40](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/inviteEventAttendee.ts#L40)
