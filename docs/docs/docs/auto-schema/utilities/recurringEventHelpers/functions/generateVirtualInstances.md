[Admin Docs](/)

***

# Function: generateVirtualInstances()

> **generateVirtualInstances**(`baseEvent`, `recurrenceRule`, `windowStart`, `windowEnd`, `exceptions`): [`VirtualEventInstance`](../type-aliases/VirtualEventInstance.md)[]

Defined in: [src/utilities/recurringEventHelpers.ts:73](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/recurringEventHelpers.ts#L73)

Generate virtual event instances for a given time window
This is the core inheritance function - instances inherit from template

## Parameters

### baseEvent

#### allDay

`boolean`

#### createdAt

`Date`

#### creatorId

`string`

#### description

`string`

#### endAt

`Date`

#### id

`string`

#### instanceStartTime

`Date`

#### isPublic

`boolean`

#### isRecurringTemplate

`boolean`

#### isRegisterable

`boolean`

#### location

`string`

#### name

`string`

#### organizationId

`string`

#### recurringEventId

`string`

#### startAt

`Date`

#### updatedAt

`Date`

#### updaterId

`string`

### recurrenceRule

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

### windowStart

`Date`

### windowEnd

`Date`

### exceptions

`object`[] = `[]`

## Returns

[`VirtualEventInstance`](../type-aliases/VirtualEventInstance.md)[]
