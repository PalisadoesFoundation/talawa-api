[Admin Docs](/)

***

# Function: isEndDateBasedEvent()

> **isEndDateBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEventHelpers.ts:290](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/recurringEventHelpers.ts#L290)

Determines if a recurrence rule is end-date-based.
An end-date-based event is defined by an `endDate`. It may or may not also have a `count`,
in which case it would be considered a hybrid event.

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

`true` if the event has an end date, otherwise `false`.
