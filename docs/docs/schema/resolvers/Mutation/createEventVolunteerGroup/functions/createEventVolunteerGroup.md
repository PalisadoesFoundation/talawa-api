[**talawa-api**](../../../../README.md)

***

# Function: createEventVolunteerGroup()

> **createEventVolunteerGroup**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

Creates a new event volunteer group and associates it with an event.

This resolver performs the following actions:

1. Validates the existence of the current user.
2. Checks if the specified event exists.
3. Verifies that the current user is an admin of the event.
4. Creates a new volunteer group for the event.
5. Fetches or creates new volunteers for the group.
6. Creates volunteer group membership records for the new volunteers.
7. Updates the event to include the new volunteer group.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateEventVolunteerGroupArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateEventVolunteerGroupArgs.md), `"data"`\>

The input arguments for the mutation, including:
  - `data`: An object containing:
   - `eventId`: The ID of the event to associate the volunteer group with.
   - `name`: The name of the volunteer group.
   - `description`: A description of the volunteer group.
   - `leaderId`: The ID of the user who will lead the volunteer group.
   - `volunteerIds`: An array of user IDs for the volunteers in the group.
   - `volunteersRequired`: The number of volunteers required for the group.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEventVolunteerGroup`](../../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)\>\>

A promise that resolves to the created event volunteer group object.

## Remarks

This function first checks the cache for the current user and then queries the database if needed. It ensures that the user is authorized to create a volunteer group for the event before proceeding.

## Defined in

[src/resolvers/Mutation/createEventVolunteerGroup.ts:44](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createEventVolunteerGroup.ts#L44)
