[**talawa-api**](../../../../README.md)

***

# Function: createEventVolunteer()

> **createEventVolunteer**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

Creates a new event volunteer entry.

This function performs the following actions:
1. Validates the existence of the current user.
2. Checks if the specified user and event exist.
3. Verifies that the current user is an admin of the event.
4. Creates a new volunteer entry for the event.
5. Creates a volunteer membership record for the new volunteer.
6. Returns the created event volunteer record.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateEventVolunteerArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateEventVolunteerArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.userId`: The ID of the user to be assigned as a volunteer.
  - `data.eventId`: The ID of the event for which the volunteer is being created.
  - `data.groupId`: The ID of the volunteer group to which the user is being added.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user performing the operation.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteer`](../../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)\>\>

The created event volunteer record.

## Defined in

[src/resolvers/Mutation/createEventVolunteer.ts:35](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createEventVolunteer.ts#L35)
