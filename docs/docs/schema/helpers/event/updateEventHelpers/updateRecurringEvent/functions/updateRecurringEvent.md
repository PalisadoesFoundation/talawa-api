[**talawa-api**](../../../../../README.md)

***

# Function: updateRecurringEvent()

> **updateRecurringEvent**(`args`, `event`, `session`): `Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

This function updates a recurring event based on the provided arguments.

## Parameters

### args

[`MutationUpdateEventArgs`](../../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateEventArgs.md)

The arguments containing data for updating the event.

### event

[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)

The event to be updated.

### session

`ClientSession`

The Mongoose client session for database transactions.

## Returns

`Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

The updated event object.

## Defined in

[src/helpers/event/updateEventHelpers/updateRecurringEvent.ts:20](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/helpers/event/updateEventHelpers/updateRecurringEvent.ts#L20)
