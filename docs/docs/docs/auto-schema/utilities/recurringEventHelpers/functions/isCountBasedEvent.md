[Admin Docs](/)

***

# Function: isCountBasedEvent()

> **isCountBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEventHelpers.ts:276](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/recurringEventHelpers.ts#L276)

Determines if a recurrence rule is count-based.
A count-based event is defined by a `count` of occurrences and does not have an `endDate`.

## Parameters

### rule

The recurrence rule to check.

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

`boolean`

`true` if the event is count-based, otherwise `false`.
