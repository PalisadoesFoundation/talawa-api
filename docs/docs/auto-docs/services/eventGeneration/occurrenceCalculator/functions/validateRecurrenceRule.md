[API Docs](/)

***

# Function: validateRecurrenceRule()

> **validateRecurrenceRule**(`recurrenceRule`): `boolean`

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:498](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/occurrenceCalculator.ts#L498)

Validates the configuration of a recurrence rule to ensure it has a valid frequency
and a positive interval.

## Parameters

### recurrenceRule

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

`boolean`

`true` if the recurrence rule is valid, otherwise `false`.
