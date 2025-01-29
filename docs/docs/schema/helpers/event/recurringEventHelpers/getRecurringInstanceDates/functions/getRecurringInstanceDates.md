[**talawa-api**](../../../../../README.md)

***

# Function: getRecurringInstanceDates()

> **getRecurringInstanceDates**(`recurrenceRuleString`, `recurrenceStartDate`, `recurrenceEndDate`, `queryUptoDate`): `Date`[]

Generates dates of recurrence for the recurring event based on provided recurrence rules.

## Parameters

### recurrenceRuleString

`string`

The rrule string defining the recurrence rules.

### recurrenceStartDate

`Date`

The starting date from which to generate instances.

### recurrenceEndDate

`Date`

The end date of the event.

### queryUptoDate

`Date` = `recurrenceStartDate`

The limit date for querying recurrence rules (used for dynamic instance generation during queries).

## Returns

`Date`[]

Dates for recurring instances to be generated during this operation.

## Remarks

This function performs the following steps:
1. Determines the date limit for instance generation based on the recurrence frequency.
2. Retrieves dates for recurring event instances within the specified limits.

## Defined in

[src/helpers/event/recurringEventHelpers/getRecurringInstanceDates.ts:25](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/helpers/event/recurringEventHelpers/getRecurringInstanceDates.ts#L25)
