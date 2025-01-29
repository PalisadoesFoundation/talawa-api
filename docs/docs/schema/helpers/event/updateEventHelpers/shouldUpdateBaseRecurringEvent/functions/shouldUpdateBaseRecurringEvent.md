[Admin Docs](/)

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

[src/helpers/event/updateEventHelpers/shouldUpdateBaseRecurringEvent.ts:8](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/helpers/event/updateEventHelpers/shouldUpdateBaseRecurringEvent.ts#L8)
