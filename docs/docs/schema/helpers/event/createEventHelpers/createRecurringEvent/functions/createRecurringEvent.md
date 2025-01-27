[**talawa-api**](../../../../../README.md)

***

# Function: createRecurringEvent()

> **createRecurringEvent**(`args`, `creatorId`, `organizationId`, `session`, `chat`): `Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

Creates instances of a recurring event up to a specified end date.

## Parameters

### args

[`MutationCreateEventArgs`](../../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateEventArgs.md)

The payload of the createEvent mutation, including event data and recurrence rule.

### creatorId

`string`

The ID of the event creator.

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

The created instance of the recurring event.

## See

Parent file:
- `resolvers/Mutation/createEvent.ts`
- `resolvers/Query/eventsByOrganizationConnection.ts`

## Remarks

Steps performed by this function:
1. If no recurrence rule is provided, defaults to weekly recurrence starting from a given date.
2. Generates a recurrence rule string based on provided or default recurrence data.
3. Creates a base recurring event template in the database.
4. Retrieves dates for all recurring instances based on the recurrence rule.
5. Saves the recurrence rule in the database for future reference.
6. Generates and saves instances of recurring events based on the recurrence rule.

## Defined in

[src/helpers/event/createEventHelpers/createRecurringEvent.ts:35](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/helpers/event/createEventHelpers/createRecurringEvent.ts#L35)
