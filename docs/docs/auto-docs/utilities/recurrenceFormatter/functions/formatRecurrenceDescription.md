[API Docs](/)

***

# Function: formatRecurrenceDescription()

> **formatRecurrenceDescription**(`rule`): `string`

Defined in: src/utilities/recurrenceFormatter.ts:17

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

`string`

- A human-readable description of the recurrence pattern
