[Admin Docs](/)

***

# Interface: RecurrenceContext

Defined in: [src/services/eventInstanceMaterialization/types.ts:84](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L84)

Recurrence calculation context

## Properties

### eventDuration

> **eventDuration**: `number`

Defined in: [src/services/eventInstanceMaterialization/types.ts:85](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L85)

***

### exceptionsByTime

> **exceptionsByTime**: `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `eventInstanceId`: `string`; `exceptionData`: `unknown`; `exceptionType`: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`; `id`: `string`; `instanceStartTime`: `Date`; `organizationId`: `string`; `recurringEventId`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/services/eventInstanceMaterialization/types.ts:89](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L89)

***

### isNeverEnding

> **isNeverEnding**: `boolean`

Defined in: [src/services/eventInstanceMaterialization/types.ts:88](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L88)

***

### maxIterations

> **maxIterations**: `number`

Defined in: [src/services/eventInstanceMaterialization/types.ts:90](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L90)

***

### shouldCalculateTotalCount

> **shouldCalculateTotalCount**: `boolean`

Defined in: [src/services/eventInstanceMaterialization/types.ts:87](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L87)

***

### totalCount

> **totalCount**: `number`

Defined in: [src/services/eventInstanceMaterialization/types.ts:86](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/types.ts#L86)
