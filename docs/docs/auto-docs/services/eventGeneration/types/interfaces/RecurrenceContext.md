[API Docs](/)

***

# Interface: RecurrenceContext

Defined in: [src/services/eventGeneration/types.ts:93](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L93)

Recurrence calculation context

## Properties

### eventDuration

> **eventDuration**: `number`

Defined in: [src/services/eventGeneration/types.ts:94](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L94)

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/services/eventGeneration/types.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L98)

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:97](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L97)

***

### maxIterations

> **maxIterations**: `number`

Defined in: [src/services/eventGeneration/types.ts:99](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L99)

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:96](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L96)

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: [src/services/eventGeneration/types.ts:95](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L95)
