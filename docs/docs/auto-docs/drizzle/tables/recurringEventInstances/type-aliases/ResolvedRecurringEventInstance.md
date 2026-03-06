[API Docs](/)

***

# Type Alias: ResolvedRecurringEventInstance

> **ResolvedRecurringEventInstance** = `object`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:326](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L326)

Type representing a fully resolved recurring event event instance.
This includes all inherited properties from the template plus any exceptions applied.

## Properties

### actualEndDate

> **actualEndDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:339](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L339)

***

### actualEndTime

> **actualEndTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:335](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L335)

***

### actualStartDate

> **actualStartDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:338](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L338)

***

### actualStartTime

> **actualStartTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:334](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L334)

***

### allDay

> **allDay**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:354](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L354)

***

### appliedExceptionData

> **appliedExceptionData**: `Record`\<`string`, `unknown`\> \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:365](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L365)

***

### attachments

> **attachments**: *typeof* `eventAttachmentsTable.$inferSelect`[]

Defined in: [src/drizzle/tables/recurringEventInstances.ts:370](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L370)

***

### baseRecurringEventId

> **baseRecurringEventId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:329](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L329)

***

### createdAt

> **createdAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:360](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L360)

***

### creatorId

> **creatorId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:358](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L358)

***

### description

> **description**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:352](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L352)

***

### exceptionCreatedAt

> **exceptionCreatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:367](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L367)

***

### exceptionCreatedBy

> **exceptionCreatedBy**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:366](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L366)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:342](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L342)

***

### hasExceptions

> **hasExceptions**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:364](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L364)

***

### id

> **id**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:328](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L328)

***

### isCancelled

> **isCancelled**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:340](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L340)

***

### isInviteOnly

> **isInviteOnly**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:357](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L357)

***

### isPublic

> **isPublic**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:355](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L355)

***

### isRegisterable

> **isRegisterable**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:356](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L356)

***

### lastUpdatedAt

> **lastUpdatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:343](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L343)

***

### location

> **location**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:353](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L353)

***

### name

> **name**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:351](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L351)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:341](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L341)

***

### originalInstanceStartDate

> **originalInstanceStartDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:337](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L337)

***

### originalInstanceStartTime

> **originalInstanceStartTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:333](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L333)

***

### originalSeriesId

> **originalSeriesId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:331](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L331)

***

### recurrenceRuleId

> **recurrenceRuleId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:330](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L330)

***

### sequenceNumber

> **sequenceNumber**: `number`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:347](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L347)

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:348](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L348)

***

### updatedAt

> **updatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:361](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L361)

***

### updaterId

> **updaterId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:359](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L359)

***

### version

> **version**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:344](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L344)
