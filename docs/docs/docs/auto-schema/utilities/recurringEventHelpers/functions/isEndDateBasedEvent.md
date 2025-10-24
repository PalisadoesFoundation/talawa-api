[Admin Docs](/)

***

# Function: isEndDateBasedEvent()

> **isEndDateBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEventHelpers.ts:298](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/recurringEventHelpers.ts#L298)

Determines if a recurrence rule is end-date-based.
An end-date-based event is defined by an `endDate`. It may or may not also have a `count`,
in which case it would be considered a hybrid event.

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

`true` if the event has an end date, otherwise `false`.
