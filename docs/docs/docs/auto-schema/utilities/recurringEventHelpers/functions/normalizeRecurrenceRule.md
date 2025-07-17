[Admin Docs](/)

***

# Function: normalizeRecurrenceRule()

> **normalizeRecurrenceRule**(`rule`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:130](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/utilities/recurringEventHelpers.ts#L130)

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

A normalized recurrence rule, where `count` has been converted to `recurrenceEndDate`.

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
