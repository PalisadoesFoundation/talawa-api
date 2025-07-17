[Admin Docs](/)

***

# Function: getEventType()

> **getEventType**(`rule`): `"NEVER_ENDING"` \| `"COUNT_BASED"` \| `"END_DATE_BASED"` \| `"HYBRID"`

Defined in: [src/utilities/recurringEventHelpers.ts:279](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L279)

Gets the event type classification for a recurrence rule.

## Parameters

### rule

The recurrence rule to classify

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

`"NEVER_ENDING"` \| `"COUNT_BASED"` \| `"END_DATE_BASED"` \| `"HYBRID"`

Event type classification
