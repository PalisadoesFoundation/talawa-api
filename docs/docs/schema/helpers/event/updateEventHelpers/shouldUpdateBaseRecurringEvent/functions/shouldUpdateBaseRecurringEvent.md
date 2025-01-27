[**talawa-api**](../../../../../README.md)

***

# Function: shouldUpdateBaseRecurringEvent()

> **shouldUpdateBaseRecurringEvent**(`recurrenceRuleEndDate`, `baseRecurringEventEndDate`): `boolean`

This function checks whether the baseRecurringEvent should be updated.

## Parameters

### recurrenceRuleEndDate

`string`

the end date of the recurrence rule.

### baseRecurringEventEndDate

`string`

the end date of the base recurring event.

## Returns

`boolean`

true if the recurrence rule is the latest rule that the instances were following, false otherwise.

## Defined in

[src/helpers/event/updateEventHelpers/shouldUpdateBaseRecurringEvent.ts:8](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/helpers/event/updateEventHelpers/shouldUpdateBaseRecurringEvent.ts#L8)
