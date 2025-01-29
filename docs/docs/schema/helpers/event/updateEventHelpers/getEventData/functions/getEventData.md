[Admin Docs](/)

***

# Function: getEventData()

> **getEventData**(`updateEventInputData`, `event`): [`InterfaceRecurringEvent`](../../../recurringEventHelpers/generateRecurringEventInstances/interfaces/InterfaceRecurringEvent.md)

This function retrieves the data to be used for updating an event,
combining existing event data with new input data.

## Parameters

### updateEventInputData

[`UpdateEventInput`](../../../../../types/generatedGraphQLTypes/type-aliases/UpdateEventInput.md)

The input data to update the event.

### event

[`InterfaceEvent`](../../../../../models/Event/interfaces/InterfaceEvent.md)

The current event data to be updated.

## Returns

[`InterfaceRecurringEvent`](../../../recurringEventHelpers/generateRecurringEventInstances/interfaces/InterfaceRecurringEvent.md)

The updated event data.

## Defined in

[src/helpers/event/updateEventHelpers/getEventData.ts:12](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/helpers/event/updateEventHelpers/getEventData.ts#L12)
