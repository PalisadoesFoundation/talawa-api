[Admin Docs](/)

***

# Function: validateRecurrenceRule()

> **validateRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:327](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L327)

Validates that a recurrence rule has valid configuration.
This is for database-level recurrence rules, different from GraphQL input validation above.

## Parameters

### rule

The recurrence rule to validate

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

Object with validation result and any errors

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
