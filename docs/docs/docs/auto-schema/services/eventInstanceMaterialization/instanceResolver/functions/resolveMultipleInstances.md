[Admin Docs](/)

***

# Function: resolveMultipleInstances()

> **resolveMultipleInstances**(`instances`, `templatesMap`, `exceptionsMap`, `logger`): [`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:133](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/instanceResolver.ts#L133)

Resolves multiple instances in batch for better performance

## Parameters

### instances

`object`[]

### templatesMap

`Map`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string`; `description`: `string`; `endAt`: `Date`; `id`: `string`; `instanceStartTime`: `Date`; `isPublic`: `boolean`; `isRecurringTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string`; `name`: `string`; `organizationId`: `string`; `recurringEventId`: `string`; `startAt`: `Date`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

### exceptionsMap

`Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `eventInstanceId`: `string`; `exceptionData`: `unknown`; `exceptionType`: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`; `id`: `string`; `instanceStartTime`: `Date`; `organizationId`: `string`; `recurringEventId`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

### logger

`FastifyBaseLogger`

## Returns

[`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]
