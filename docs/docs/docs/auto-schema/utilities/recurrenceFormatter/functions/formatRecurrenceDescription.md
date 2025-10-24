[Admin Docs](/)

***

# Function: formatRecurrenceDescription()

> **formatRecurrenceDescription**(`rule`): `string`

Defined in: [src/utilities/recurrenceFormatter.ts:17](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/recurrenceFormatter.ts#L17)

Converts a recurrence rule into a human-readable description.

Examples:
- "Daily"
- "Weekly on Monday"
- "Weekly on Monday, Wednesday, Friday"
- "Monthly on the 15th"
- "Monthly on the first Monday"
- "Yearly on January 1st"

## Parameters

### rule

The recurrence rule from the database

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

`string`

A human-readable description of the recurrence pattern
