[Admin Docs](/)

***

# Interface: ResolveInstanceInput

Defined in: [src/services/eventGeneration/types.ts:56](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/services/eventGeneration/types.ts#L56)

Input for resolving instance with inheritance

## Properties

### baseTemplate

> **baseTemplate**: `object`

Defined in: [src/services/eventGeneration/types.ts:58](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/services/eventGeneration/types.ts#L58)

#### allDay

> **allDay**: `boolean`

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `null` \| `string`

#### description

> **description**: `null` \| `string`

#### endAt

> **endAt**: `Date`

#### id

> **id**: `string`

#### isPublic

> **isPublic**: `boolean`

#### isRecurringEventTemplate

> **isRecurringEventTemplate**: `boolean`

#### isRegisterable

> **isRegisterable**: `boolean`

#### location

> **location**: `null` \| `string`

#### name

> **name**: `string`

#### organizationId

> **organizationId**: `string`

#### startAt

> **startAt**: `Date`

#### updatedAt

> **updatedAt**: `null` \| `Date`

#### updaterId

> **updaterId**: `null` \| `string`

***

### exception?

> `optional` **exception**: `object`

Defined in: [src/services/eventGeneration/types.ts:59](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/services/eventGeneration/types.ts#L59)

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string`

#### exceptionData

> **exceptionData**: `unknown`

#### id

> **id**: `string`

#### organizationId

> **organizationId**: `string`

#### recurringEventInstanceId

> **recurringEventInstanceId**: `string`

#### updatedAt

> **updatedAt**: `null` \| `Date`

#### updaterId

> **updaterId**: `null` \| `string`

***

### generatedInstance

> **generatedInstance**: `object`

Defined in: [src/services/eventGeneration/types.ts:57](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/services/eventGeneration/types.ts#L57)

#### actualEndTime

> **actualEndTime**: `Date`

#### actualStartTime

> **actualStartTime**: `Date`

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### generatedAt

> **generatedAt**: `Date`

#### id

> **id**: `string`

#### isCancelled

> **isCancelled**: `boolean`

#### lastUpdatedAt

> **lastUpdatedAt**: `null` \| `Date`

#### organizationId

> **organizationId**: `string`

#### originalInstanceStartTime

> **originalInstanceStartTime**: `Date`

#### originalSeriesId

> **originalSeriesId**: `string`

#### recurrenceRuleId

> **recurrenceRuleId**: `string`

#### sequenceNumber

> **sequenceNumber**: `number`

#### totalCount

> **totalCount**: `null` \| `number`

#### version

> **version**: `string`
