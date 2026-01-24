[**talawa-api**](../../../../README.md)

***

# Interface: RecurrenceContext

Defined in: src/services/eventGeneration/types.ts:84

Recurrence calculation context

## Properties

### eventDuration

> **eventDuration**: `number`

Defined in: src/services/eventGeneration/types.ts:85

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: src/services/eventGeneration/types.ts:89

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: src/services/eventGeneration/types.ts:88

***

### maxIterations

> **maxIterations**: `number`

Defined in: src/services/eventGeneration/types.ts:90

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: src/services/eventGeneration/types.ts:87

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: src/services/eventGeneration/types.ts:86
