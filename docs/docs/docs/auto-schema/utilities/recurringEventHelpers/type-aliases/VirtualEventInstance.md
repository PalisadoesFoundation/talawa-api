[Admin Docs](/)

***

# Type Alias: VirtualEventInstance

> **VirtualEventInstance** = `InferSelectModel`\<*typeof* [`eventsTable`](../../../drizzle/tables/events/variables/eventsTable.md)\> & `object`

Defined in: [src/utilities/recurringEventHelpers.ts:11](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/recurringEventHelpers.ts#L11)

Represents a virtual event instance (computed on-demand)

## Type declaration

### baseEventId

> **baseEventId**: `string`

### endAt

> **endAt**: `Date`

### hasExceptions

> **hasExceptions**: `boolean`

### id

> **id**: `string`

### instanceStartTime

> **instanceStartTime**: `Date`

### isRecurringTemplate

> **isRecurringTemplate**: `false`

### isVirtualInstance

> **isVirtualInstance**: `true`

### recurringEventId

> **recurringEventId**: `string`

### startAt

> **startAt**: `Date`
