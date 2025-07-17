[Admin Docs](/)

***

# Function: calculateCompletionDateFromCount()

> **calculateCompletionDateFromCount**(`startDate`, `count`, `frequency`, `interval`): `Date`

Defined in: [src/utilities/recurringEventHelpers.ts:164](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/utilities/recurringEventHelpers.ts#L164)

Calculates the completion date of a recurrence that is defined by a `count`.
This function is used internally by `normalizeRecurrenceRule` to convert a count-based
recurrence into an end-date-based one. It can also be used for estimating the
duration of a recurring event.

## Parameters

### startDate

`Date`

The start date of the recurrence.

### count

`number`

The total number of occurrences.

### frequency

`string`

The frequency of the recurrence (e.g., "DAILY", "WEEKLY").

### interval

`number` = `1`

The interval between occurrences (default is 1).

## Returns

`Date`

The calculated date of the final occurrence.
