[API Docs](/)

***

# Interface: ResolveInstanceInput

Defined in: [src/services/eventGeneration/types.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L70)

Input for resolving instance with inheritance

## Properties

### baseTemplate

> **baseTemplate**: [`EventTemplateWithAttachments`](../type-aliases/EventTemplateWithAttachments.md)

Defined in: [src/services/eventGeneration/types.ts:72](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L72)

***

### exception?

> `optional` **exception**: `object`

Defined in: [src/services/eventGeneration/types.ts:73](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L73)

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string` \| `null`

#### exceptionData

> **exceptionData**: `unknown`

#### id

> **id**: `string`

#### organizationId

> **organizationId**: `string`

#### recurringEventInstanceId

> **recurringEventInstanceId**: `string`

#### updatedAt

> **updatedAt**: `Date` \| `null`

#### updaterId

> **updaterId**: `string` \| `null`

***

### generatedInstance

> **generatedInstance**: `object`

Defined in: [src/services/eventGeneration/types.ts:71](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L71)

#### actualEndDate

> **actualEndDate**: `string` \| `null`

#### actualEndTime

> **actualEndTime**: `Date` \| `null`

#### actualStartDate

> **actualStartDate**: `string` \| `null`

#### actualStartTime

> **actualStartTime**: `Date` \| `null`

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### generatedAt

> **generatedAt**: `Date`

#### id

> **id**: `string`

#### isCancelled

> **isCancelled**: `boolean`

#### lastUpdatedAt

> **lastUpdatedAt**: `Date` \| `null`

#### organizationId

> **organizationId**: `string`

#### originalInstanceStartDate

> **originalInstanceStartDate**: `string` \| `null`

#### originalInstanceStartTime

> **originalInstanceStartTime**: `Date` \| `null`

#### originalSeriesId

> **originalSeriesId**: `string`

#### recurrenceRuleId

> **recurrenceRuleId**: `string`

#### sequenceNumber

> **sequenceNumber**: `number`

#### totalCount

> **totalCount**: `number` \| `null`

#### version

> **version**: `string`
