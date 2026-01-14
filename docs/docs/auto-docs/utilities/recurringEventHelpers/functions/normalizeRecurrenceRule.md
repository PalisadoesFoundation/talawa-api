[**talawa-api**](../../../README.md)

***

# Function: normalizeRecurrenceRule()

> **normalizeRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:138](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/recurringEventHelpers.ts#L138)

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

`object`

- A normalized recurrence rule, where `count` has been converted to `recurrenceEndDate`.

### baseRecurringEventId

> **baseRecurringEventId**: `string`

### byDay

> **byDay**: `string`[] \| `null`

### byMonth

> **byMonth**: `number`[] \| `null`

### byMonthDay

> **byMonthDay**: `number`[] \| `null`

### count

> **count**: `number` \| `null`

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

> **originalSeriesId**: `string` \| `null`

### recurrenceEndDate

> **recurrenceEndDate**: `Date` \| `null`

### recurrenceRuleString

> **recurrenceRuleString**: `string`

### recurrenceStartDate

> **recurrenceStartDate**: `Date`

### updatedAt

> **updatedAt**: `Date` \| `null`

### updaterId

> **updaterId**: `string` \| `null`
