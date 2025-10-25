[Admin Docs](/)

***

# Function: validateRecurrenceRule()

> **validateRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:477](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/utilities/recurringEventHelpers.ts#L477)

Validates a recurrence rule from the database to ensure its configuration is valid.
This function checks for the presence of a valid frequency, ensures that the interval
and count are positive integers if they exist, and verifies that the end date is
after the start date.

## Parameters

### rule

The recurrence rule to validate.

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

`object`

An object with a boolean `isValid` and an array of error strings.

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
