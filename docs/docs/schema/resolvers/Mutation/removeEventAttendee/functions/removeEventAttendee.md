[**talawa-api**](../../../../README.md)

***

# Function: removeEventAttendee()

> **removeEventAttendee**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Removes a user from the list of attendees for a specific event.

This function manages the removal of an event attendee by first verifying
the current user's authorization and the existence of the event. It checks
if the user making the request is either a super admin or an admin of the event,
and if the user to be removed is indeed registered as an attendee for the event.
If all checks pass, the user is removed from the event's attendee list.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveEventAttendeeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveEventAttendeeArgs.md), `"data"`\>

Contains the arguments passed to the GraphQL mutation, specifically the event ID and user ID of the attendee to be removed.

### context

`any`

Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

The details of the removed user if the removal was successful.

## Defined in

[src/resolvers/Mutation/removeEventAttendee.ts:38](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/removeEventAttendee.ts#L38)
