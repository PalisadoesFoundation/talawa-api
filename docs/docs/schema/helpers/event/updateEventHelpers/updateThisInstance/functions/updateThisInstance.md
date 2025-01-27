[**talawa-api**](../../../../../README.md)

***

# Function: updateThisInstance()

> **updateThisInstance**(`args`, `event`, `session`): `Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

This function updates only this instance of a recurrence pattern.
This will make the instance an exception to the recurrence pattern.

## Parameters

### args

[`MutationUpdateEventArgs`](../../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateEventArgs.md)

update event args.

### event

[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)

the event to be updated.

### session

`ClientSession`

## Returns

`Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

The updated recurring event instance.

## Remarks

The following steps are followed:
1. Update this instance.

## Defined in

[src/helpers/event/updateEventHelpers/updateThisInstance.ts:17](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/helpers/event/updateEventHelpers/updateThisInstance.ts#L17)
