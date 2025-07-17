[Admin Docs](/)

***

# Function: calculateCompletionDateFromCount()

> **calculateCompletionDateFromCount**(`startDate`, `count`, `frequency`, `interval`): `Date`

Defined in: [src/utilities/recurringEventHelpers.ts:147](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L147)

Calculates when a count-based recurrence will complete.
Used internally by normalizeRecurrenceRule and can be used for estimations.

## Parameters

### startDate

`Date`

When the recurrence starts

### count

`number`

Number of occurrences

### frequency

`string`

Recurrence frequency (DAILY, WEEKLY, MONTHLY, YEARLY)

### interval

`number` = `1`

Interval between occurrences (default: 1)

## Returns

`Date`

Date when the final occurrence will happen
