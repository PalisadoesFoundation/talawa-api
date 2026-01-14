[**talawa-api**](../../../../README.md)

***

# Function: validateRecurrenceRule()

> **validateRecurrenceRule**(`recurrenceRule`): `boolean`

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:498](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/services/eventGeneration/occurrenceCalculator.ts#L498)

Validates the configuration of a recurrence rule to ensure it has a valid frequency
and a positive interval.

## Parameters

### recurrenceRule

The recurrence rule to validate.

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

`true` if the recurrence rule is valid, otherwise `false`.
