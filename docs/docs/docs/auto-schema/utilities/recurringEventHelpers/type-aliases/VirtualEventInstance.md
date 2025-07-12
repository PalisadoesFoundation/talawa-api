[Admin Docs](/)

***

# Type Alias: VirtualEventInstance

> **VirtualEventInstance** = `InferSelectModel`\<*typeof* [`eventsTable`](../../../drizzle/tables/events/variables/eventsTable.md)\> & `object`

Defined in: [src/utilities/recurringEventHelpers.ts:11](https://github.com/gautam-divyanshu/talawa-api/blob/d8a8cac9e6df3a48d2412b7eda7ba90695bb5e35/src/utilities/recurringEventHelpers.ts#L11)

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
