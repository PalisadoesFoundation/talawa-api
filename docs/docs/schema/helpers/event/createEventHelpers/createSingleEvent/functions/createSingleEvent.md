[**talawa-api**](../../../../../README.md)

***

# Function: createSingleEvent()

> **createSingleEvent**(`args`, `creatorId`, `organizationId`, `session`, `chat`): `Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

Creates a single non-recurring event.

## Parameters

### args

[`MutationCreateEventArgs`](../../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateEventArgs.md)

Arguments provided for the createEvent mutation, including event data.

### creatorId

`string`

The ID of the current user creating the event.

### organizationId

`string`

The ID of the organization to which the event belongs.

### session

`ClientSession`

The MongoDB client session for transactional operations.

### chat

[`InterfaceChat`](../../../../../models/Chat/interfaces/InterfaceChat.md)

## Returns

`Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

The created event instance.

## See

Parent file:
- `resolvers/Mutation/createEvent.ts`,
- `resolvers/Query/eventsByOrganizationConnection.ts`

## Remarks

This function follows these steps:
1. Creates an event document in the database with provided data.
2. Associates the event with the current user as creator and admin.
3. Updates user's registered events list with the new event.
4. Updates user's AppUserProfile with event admin and created events references.
5. Caches the newly created event for faster access.

## Defined in

[src/helpers/event/createEventHelpers/createSingleEvent.ts:29](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/helpers/event/createEventHelpers/createSingleEvent.ts#L29)
