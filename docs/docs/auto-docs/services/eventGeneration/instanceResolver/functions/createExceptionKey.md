[API Docs](/)

***

# Function: createExceptionKey()

> **createExceptionKey**(`recurringEventId`, `instanceStartTime`): `string`

Defined in: src/services/eventGeneration/instanceResolver.ts:206

Creates a composite key for the exception lookup map.
This key is used to uniquely identify an exception based on the recurring event ID
and the original start time of the instance.

## Parameters

### recurringEventId

`string`

The ID of the recurring event.

### instanceStartTime

`Date`

The original start time of the instance.

## Returns

`string`

- A string representing the composite key.
