[**talawa-api**](../../../../README.md)

***

# Function: getEventType()

> **getEventType**(`rule`): `"NEVER_ENDING"` \| `"COUNT_BASED"` \| `"END_DATE_BASED"` \| `"HYBRID"`

Defined in: [src/utilities/recurringEvent/types.ts:58](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/recurringEvent/types.ts#L58)

Classifies a recurrence rule into one of four types: "NEVER_ENDING", "COUNT_BASED",
"END_DATE_BASED", or "HYBRID". This helps in understanding how the recurrence
is defined and constrained.

## Parameters

### rule

The recurrence rule to classify.

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

`"NEVER_ENDING"` \| `"COUNT_BASED"` \| `"END_DATE_BASED"` \| `"HYBRID"`

- The classification of the event type as a string literal.
