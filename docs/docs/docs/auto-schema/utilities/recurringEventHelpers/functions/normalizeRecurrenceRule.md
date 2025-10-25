[Admin Docs](/)

***

# Function: normalizeRecurrenceRule()

> **normalizeRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:138](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/utilities/recurringEventHelpers.ts#L138)

Normalizes a recurrence rule by converting a `count`-based rule to an `endDate`-based one.
This allows for uniform processing of events that have a defined end, whether specified
by a count of occurrences or a specific end date. If the rule is already `endDate`-based
or is infinite (never-ending), it is returned unchanged.

## Parameters

### rule

The recurrence rule from the database.

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

`object`

A normalized recurrence rule, where `count` has been converted to `recurrenceEndDate`.

### baseRecurringEventId

> **baseRecurringEventId**: `string`

### byDay

> **byDay**: `null` \| `string`[]

### byMonth

> **byMonth**: `null` \| `number`[]

### byMonthDay

> **byMonthDay**: `null` \| `number`[]

### count

> **count**: `null` \| `number`

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

### originalSeriesId

> **originalSeriesId**: `null` \| `string`

### recurrenceEndDate

> **recurrenceEndDate**: `null` \| `Date`

### recurrenceRuleString

> **recurrenceRuleString**: `string`

### recurrenceStartDate

> **recurrenceStartDate**: `Date`

### updatedAt

> **updatedAt**: `null` \| `Date`

### updaterId

> **updaterId**: `null` \| `string`
