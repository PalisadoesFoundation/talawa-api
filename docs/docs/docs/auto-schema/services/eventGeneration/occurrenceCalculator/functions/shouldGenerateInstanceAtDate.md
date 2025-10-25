[Admin Docs](/)

***

# Function: shouldGenerateInstanceAtDate()

> **shouldGenerateInstanceAtDate**(`date`, `recurrenceRule`, `startDate`): `boolean`

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:253](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/services/eventGeneration/occurrenceCalculator.ts#L253)

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

### startDate

`Date`

The start date of the base event.

## Returns

`boolean`

`true` if an instance should be generated on the given date, otherwise `false`.
