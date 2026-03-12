[API Docs](/)

***

# Type Alias: ResolvedRecurringEventInstance

> **ResolvedRecurringEventInstance** = `object`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:345](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L345)

Type representing a fully resolved recurring event event instance.
This includes all inherited properties from the template plus any exceptions applied.

## Properties

### actualEndDate

> **actualEndDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:358](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L358)

***

### actualEndTime

> **actualEndTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:354](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L354)

***

### actualStartDate

> **actualStartDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:357](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L357)

***

### actualStartTime

> **actualStartTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:353](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L353)

***

### allDay

> **allDay**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:373](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L373)

***

### appliedExceptionData

> **appliedExceptionData**: `Record`\<`string`, `unknown`\> \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:384](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L384)

***

### attachments

> **attachments**: *typeof* `eventAttachmentsTable.$inferSelect`[]

Defined in: [src/drizzle/tables/recurringEventInstances.ts:389](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L389)

***

### baseRecurringEventId

> **baseRecurringEventId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:348](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L348)

***

### createdAt

> **createdAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:379](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L379)

***

### creatorId

> **creatorId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:377](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L377)

***

### description

> **description**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:371](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L371)

***

### exceptionCreatedAt

> **exceptionCreatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:386](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L386)

***

### exceptionCreatedBy

> **exceptionCreatedBy**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:385](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L385)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:361](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L361)

***

### hasExceptions

> **hasExceptions**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:383](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L383)

***

### id

> **id**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:347](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L347)

***

### isCancelled

> **isCancelled**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:359](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L359)

***

### isInviteOnly

> **isInviteOnly**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:376](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L376)

***

### isPublic

> **isPublic**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:374](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L374)

***

### isRegisterable

> **isRegisterable**: `boolean`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:375](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L375)

***

### lastUpdatedAt

> **lastUpdatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:362](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L362)

***

### location

> **location**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:372](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L372)

***

### name

> **name**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:370](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L370)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:360](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L360)

***

### originalInstanceStartDate

> **originalInstanceStartDate**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:356](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L356)

***

### originalInstanceStartTime

> **originalInstanceStartTime**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:352](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L352)

***

### originalSeriesId

> **originalSeriesId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:350](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L350)

***

### recurrenceRuleId

> **recurrenceRuleId**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:349](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L349)

***

### sequenceNumber

> **sequenceNumber**: `number`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:366](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L366)

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:367](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L367)

***

### updatedAt

> **updatedAt**: `Date` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:380](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L380)

***

### updaterId

> **updaterId**: `string` \| `null`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:378](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L378)

***

### version

> **version**: `string`

Defined in: [src/drizzle/tables/recurringEventInstances.ts:363](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventInstances.ts#L363)
