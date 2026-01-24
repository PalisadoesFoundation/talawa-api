[**talawa-api**](../../../../README.md)

***

# Function: isEndDateBasedEvent()

> **isEndDateBasedEvent**(`rule`): `boolean`

Defined in: [src/utilities/recurringEvent/types.ts:44](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/recurringEvent/types.ts#L44)

Determines if a recurrence rule is end-date-based.
An end-date-based event is defined by an `endDate`. It may or may not also have a `count`,
in which case it would be considered a hybrid event.

**Note**: This returns `true` for any event with a `recurrenceEndDate`, including hybrid events
that also have a `count`. For exclusive classification, use `getEventType()` instead.

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

`true` if the event has an end date (including hybrid events), otherwise `false`.

## Example

```ts
// To check for end-date-only events (excluding hybrids):
const isEndDateOnly = rule.recurrenceEndDate && !rule.count;
```
