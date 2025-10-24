[Admin Docs](/)

***

# Function: calculateInstancesPerMonth()

> **calculateInstancesPerMonth**(`frequency`, `interval`): `number`

Defined in: [src/utilities/recurringEventHelpers.ts:450](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/utilities/recurringEventHelpers.ts#L450)

Calculates the estimated number of instances per month for a given frequency and interval.
This is useful for resource planning, performance estimations, and other calculations
where an average monthly occurrence rate is needed.

## Parameters

### frequency

`string`

The frequency of the recurrence (e.g., "DAILY", "WEEKLY").

### interval

`number` = `1`

The interval between occurrences (default is 1).

## Returns

`number`

The average number of instances expected in a month.
