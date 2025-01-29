[Admin Docs](/)

***

# Function: updateRecurringEventInstances()

> **updateRecurringEventInstances**(`args`, `event`, `recurrenceRule`, `baseRecurringEvent`, `recurringEventUpdateType`, `session`): `Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

This function updates this and the following instances of a recurring event.

## Parameters

### args

[`MutationUpdateEventArgs`](../../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateEventArgs.md)

update event args.

### event

[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)

the event to be updated.

### recurrenceRule

[`InterfaceRecurrenceRule`](../../../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)

the recurrence rule followed by the instances.

### baseRecurringEvent

[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)

the base recurring event.

### recurringEventUpdateType

[`RecurringEventMutationType`](../../../../../types/generatedGraphQLTypes/type-aliases/RecurringEventMutationType.md)

### session

`ClientSession`

## Returns

`Promise`\<[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)\>

The updated first instance following the recurrence rule.

## Remarks

The following steps are followed:
1. Check if the recurrence rule has changed.
2. If the recurrence rule has changed:
     - get the appropriate data to create new recurring event instances and update the baseRecurringEvent.
     - get the recurrence dates and generate new instances.
     - remove the current instances and their associations as a new series has been created.
   If the recurrence rule hasn't changed:
     - just perform a regular bulk update.
3. Update the base recurring event if required.
4. Removes any dangling recurrence rule and base recurrence rule documents.

## Defined in

[src/helpers/event/updateEventHelpers/updateRecurringEventInstances.ts:45](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/helpers/event/updateEventHelpers/updateRecurringEventInstances.ts#L45)
