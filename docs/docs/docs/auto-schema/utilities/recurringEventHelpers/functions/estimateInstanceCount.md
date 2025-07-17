[Admin Docs](/)

***

# Function: estimateInstanceCount()

> **estimateInstanceCount**(`rule`, `estimationWindowMonths`): `number`

Defined in: [src/utilities/recurringEventHelpers.ts:190](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L190)

Estimates the total number of instances for a recurrence rule.
For never-ending events, estimates based on a 12-month window.

## Parameters

### rule

The recurrence rule

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

### estimationWindowMonths

`number` = `12`

For never-ending events, how many months to estimate (default: 12)

## Returns

`number`

Estimated number of instances
