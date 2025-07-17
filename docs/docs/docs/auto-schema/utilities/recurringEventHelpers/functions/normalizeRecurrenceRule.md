[Admin Docs](/)

***

# Function: normalizeRecurrenceRule()

> **normalizeRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:115](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L115)

Normalizes recurrence rule by converting count to end date for unified processing.
This enables treating all bounded events (count-based or end-date-based) uniformly.

## Parameters

### rule

The original recurrence rule

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

`object`

Normalized rule with calculated end date if count-based

### baseRecurringEventId

> **baseRecurringEventId**: `string`

### byDay

> **byDay**: `string`[]

### byMonth

> **byMonth**: `number`[]

### byMonthDay

> **byMonthDay**: `number`[]

### count

> **count**: `number`

### createdAt

> **createdAt**: `Date`

### creatorId

> **creatorId**: `string`

### frequency

> **frequency**: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`

### id

> **id**: `string`

### interval

> **interval**: `number`

### latestInstanceDate

> **latestInstanceDate**: `Date`

### organizationId

> **organizationId**: `string`

### recurrenceEndDate

> **recurrenceEndDate**: `Date`

### recurrenceRuleString

> **recurrenceRuleString**: `string`

### recurrenceStartDate

> **recurrenceStartDate**: `Date`

### updatedAt

> **updatedAt**: `Date`

### updaterId

> **updaterId**: `string`
