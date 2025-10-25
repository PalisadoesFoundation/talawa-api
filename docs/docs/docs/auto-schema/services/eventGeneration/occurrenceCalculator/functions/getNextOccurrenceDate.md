[Admin Docs](/)

***

# Function: getNextOccurrenceDate()

> **getNextOccurrenceDate**(`currentDate`, `recurrenceRule`): `Date`

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:404](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/eventGeneration/occurrenceCalculator.ts#L404)

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

`null` \| `string`[]

#### byMonth

`null` \| `number`[]

#### byMonthDay

`null` \| `number`[]

#### count

`null` \| `number`

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

`null` \| `string`

#### recurrenceEndDate

`null` \| `Date`

#### recurrenceRuleString

`string`

#### recurrenceStartDate

`Date`

#### updatedAt

`null` \| `Date`

#### updaterId

`null` \| `string`

## Returns

`Date`

The date of the next potential occurrence.
