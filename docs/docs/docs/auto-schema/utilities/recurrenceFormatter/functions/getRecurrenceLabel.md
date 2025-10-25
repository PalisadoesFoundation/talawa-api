[Admin Docs](/)

***

# Function: getRecurrenceLabel()

> **getRecurrenceLabel**(`rule`): `string`

Defined in: [src/utilities/recurrenceFormatter.ts:221](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/utilities/recurrenceFormatter.ts#L221)

Gets a short recurrence label suitable for UI buttons or compact displays.

Examples:
- "Daily"
- "Weekly"
- "Monthly"
- "Every 2 weeks"
- "Every 3 months"

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

A short label describing the recurrence frequency
