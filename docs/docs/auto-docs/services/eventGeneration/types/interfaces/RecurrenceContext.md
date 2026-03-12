[API Docs](/)

***

# Interface: RecurrenceContext

Defined in: [src/services/eventGeneration/types.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L98)

Recurrence calculation context

## Properties

### allDayDurationDays

> **allDayDurationDays**: `number`

Defined in: [src/services/eventGeneration/types.ts:106](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L106)

***

### eventDuration

> **eventDuration**: `number`

Defined in: [src/services/eventGeneration/types.ts:99](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L99)

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/services/eventGeneration/types.ts:103](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L103)

***

### isAllDay

> **isAllDay**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:105](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L105)

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:102](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L102)

***

### maxIterations

> **maxIterations**: `number`

Defined in: [src/services/eventGeneration/types.ts:104](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L104)

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:101](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L101)

***

### totalCount

> **totalCount**: `number` \| `null`

Defined in: [src/services/eventGeneration/types.ts:100](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/types.ts#L100)
