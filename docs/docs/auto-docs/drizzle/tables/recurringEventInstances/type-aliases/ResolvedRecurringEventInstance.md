[**talawa-api**](../../../../README.md)

***

# Type Alias: ResolvedRecurringEventInstance

> **ResolvedRecurringEventInstance** = `object`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:298](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L298)

Type representing a fully resolved recurring event event instance.
This includes all inherited properties from the template plus any exceptions applied.

## Properties

### actualEndTime

> **actualEndTime**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:306](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L306)

***

### actualStartTime

> **actualStartTime**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:305](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L305)

***

### allDay

> **allDay**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:321](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L321)

***

### appliedExceptionData

> **appliedExceptionData**: `Record`\<`string`, `unknown`\> \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:332](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L332)

***

### baseRecurringEventId

> **baseRecurringEventId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:301](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L301)

***

### createdAt

> **createdAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:327](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L327)

***

### creatorId

> **creatorId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:325](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L325)

***

### description

> **description**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:319](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L319)

***

### exceptionCreatedAt

> **exceptionCreatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:334](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L334)

***

### exceptionCreatedBy

> **exceptionCreatedBy**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:333](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L333)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:309](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L309)

***

### hasExceptions

> **hasExceptions**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:331](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L331)

***

### id

> **id**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:300](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L300)

***

### isCancelled

> **isCancelled**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:307](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L307)

***

### isInviteOnly

> **isInviteOnly**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:324](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L324)

***

### isPublic

> **isPublic**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:322](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L322)

***

### isRegisterable

> **isRegisterable**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:323](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L323)

***

### lastUpdatedAt

> **lastUpdatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:310](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L310)

***

### location

> **location**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:320](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L320)

***

### name

> **name**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:318](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L318)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:308](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L308)

***

### originalInstanceStartTime

> **originalInstanceStartTime**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:304](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L304)

***

### originalSeriesId

> **originalSeriesId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:303](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L303)

***

### recurrenceRuleId

> **recurrenceRuleId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:302](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L302)

***

### sequenceNumber

> **sequenceNumber**: `number`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:314](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L314)

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:315](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L315)

***

### updatedAt

> **updatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:328](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L328)

***

### updaterId

> **updaterId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:326](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L326)

***

### version

> **version**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:311](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/recurringEventInstances.ts#L311)
