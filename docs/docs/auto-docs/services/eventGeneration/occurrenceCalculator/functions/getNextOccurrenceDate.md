[API Docs](/)

***

# Function: getNextOccurrenceDate()

> **getNextOccurrenceDate**(`currentDate`, `recurrenceRule`): `Date`

Defined in: src/services/eventGeneration/occurrenceCalculator.ts:413

Calculates the next potential occurrence date based on the event's frequency and interval.
This function correctly handles advancing the date for all supported frequency types.

## Parameters

### currentDate

`Date`

The current occurrence date.

### recurrenceRule

The recurrence rule for the event.

#### baseRecurringEventId

`string`

#### byDay

`string`[] \| `null`

#### byMonth

`number`[] \| `null`

#### byMonthDay

`number`[] \| `null`

#### count

`number` \| `null`

#### createdAt

`Date`

#### creatorId

`string`

#### frequency

`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`

#### id

`string`

#### interval

`number`

#### latestInstanceDate

`Date`

#### organizationId

`string`

#### originalSeriesId

`string` \| `null`

#### recurrenceEndDate

`Date` \| `null`

#### recurrenceRuleString

`string`

#### recurrenceStartDate

`Date`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

## Returns

`Date`

- The date of the next potential occurrence.
