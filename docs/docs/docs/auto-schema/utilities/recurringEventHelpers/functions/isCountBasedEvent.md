[Admin Docs](/)

***

# Function: isCountBasedEvent()

> **isCountBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEventHelpers.ts:284](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/utilities/recurringEventHelpers.ts#L284)

Determines if a recurrence rule is count-based.
A count-based event is defined by a `count` of occurrences and does not have an `endDate`.

## Parameters

### rule

The recurrence rule to check.

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

`boolean`

`true` if the event is count-based, otherwise `false`.
