[API Docs](/)

***

# Function: isEndDateBasedEvent()

> **isEndDateBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEvent/types.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recurringEvent/types.ts#L37)

Determines if a recurrence rule is end-date-based.
An end-date-based event is defined by an `endDate`. It may or may not also have a `count`,
in which case it would be considered a hybrid event.

## Parameters

### rule

The recurrence rule to check.

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

`boolean`

`true` if the event has an end date, otherwise `false`.
