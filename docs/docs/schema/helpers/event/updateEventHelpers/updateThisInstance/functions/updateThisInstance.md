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

[src/helpers/event/updateEventHelpers/updateThisInstance.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/helpers/event/updateEventHelpers/updateThisInstance.ts#L17)
