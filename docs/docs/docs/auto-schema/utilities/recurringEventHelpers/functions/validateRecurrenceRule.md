[Admin Docs](/)

***

# Function: validateRecurrenceRule()

> **validateRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:355](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/recurringEventHelpers.ts#L355)

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

## Returns

`object`

An object with a boolean `isValid` and an array of error strings.

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
