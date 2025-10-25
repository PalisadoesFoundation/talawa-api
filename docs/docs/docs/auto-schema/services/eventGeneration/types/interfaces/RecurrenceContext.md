[Admin Docs](/)

***

# Interface: RecurrenceContext

Defined in: [src/services/eventGeneration/types.ts:84](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L84)

Recurrence calculation context

## Properties

### eventDuration

> **eventDuration**: `number`

Defined in: [src/services/eventGeneration/types.ts:85](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L85)

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

Defined in: [src/services/eventGeneration/types.ts:89](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L89)

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:88](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L88)

***

### maxIterations

> **maxIterations**: `number`

Defined in: [src/services/eventGeneration/types.ts:90](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L90)

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: [src/services/eventGeneration/types.ts:87](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L87)

***

### totalCount

> **totalCount**: `null` \| `number`

Defined in: [src/services/eventGeneration/types.ts:86](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/services/eventGeneration/types.ts#L86)
