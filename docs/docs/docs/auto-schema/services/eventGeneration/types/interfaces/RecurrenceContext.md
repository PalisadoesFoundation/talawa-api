[Admin Docs](/)

***

# Interface: RecurrenceContext

Defined in: [src/services/eventGeneration/types.ts:84](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L84)

Recurrence calculation context

## Properties

### eventDuration

> **eventDuration**: `number`

Defined in: [src/services/eventGeneration/types.ts:85](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L85)

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

Defined in: [src/services/eventGeneration/types.ts:89](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L89)

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:88](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L88)

***

### maxIterations

> **maxIterations**: `number`

Defined in: [src/services/eventGeneration/types.ts:90](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L90)

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:87](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L87)

***

### totalCount

> **totalCount**: `null` \| `number`

Defined in: [src/services/eventGeneration/types.ts:86](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/types.ts#L86)
