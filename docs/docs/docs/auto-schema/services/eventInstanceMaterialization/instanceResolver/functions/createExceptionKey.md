[Admin Docs](/)

***

# Function: createExceptionKey()

> **createExceptionKey**(`recurringEventId`, `instanceStartTime`): `string`

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:193](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/instanceResolver.ts#L193)

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

A string representing the composite key.
