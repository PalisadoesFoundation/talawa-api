[Admin Docs](/)

***

# Function: shouldGenerateInstanceAtDate()

> **shouldGenerateInstanceAtDate**(`date`, `recurrenceRule`, `startDate`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/occurrenceCalculator.ts:210](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/occurrenceCalculator.ts#L210)

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

`string`[]

#### byMonth

`number`[]

#### byMonthDay

`number`[]

#### count

`number`

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

#### recurrenceEndDate

`Date`

#### recurrenceRuleString

`string`

#### recurrenceStartDate

`Date`

#### updatedAt

`Date`

#### updaterId

`string`

### startDate

`Date`

The start date of the base event.

## Returns

`boolean`

`true` if an instance should be generated on the given date, otherwise `false`.
