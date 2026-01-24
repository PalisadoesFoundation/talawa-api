[**talawa-api**](../../../../README.md)

***

# Function: shouldGenerateInstanceAtDate()

> **shouldGenerateInstanceAtDate**(`date`, `recurrenceRule`, `startDate`): `boolean`

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:262](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/services/eventGeneration/occurrenceCalculator.ts#L262)

Determines whether a recurring event instance should be generated on a specific date,
based on the recurrence rule and its frequency-specific constraints.

## Parameters

### date

`Date`

The date to check.

### recurrenceRule

The recurrence rule to apply.

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

### startDate

`Date`

The start date of the base event.

## Returns

`boolean`

`true` if an instance should be generated on the given date, otherwise `false`.
