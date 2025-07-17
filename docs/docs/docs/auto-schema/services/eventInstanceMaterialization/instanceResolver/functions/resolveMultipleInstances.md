[Admin Docs](/)

***

# Function: resolveMultipleInstances()

> **resolveMultipleInstances**(`instances`, `templatesMap`, `exceptionsMap`, `logger`): [`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:150](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/instanceResolver.ts#L150)

Resolves multiple materialized instances in a batch operation to improve performance.
This function iterates through a list of instances and applies the inheritance and
exception logic to each one.

## Parameters

### instances

`object`[]

An array of materialized instances to resolve.

### templatesMap

`Map`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `string`; `description`: `string`; `endAt`: `Date`; `id`: `string`; `instanceStartTime`: `Date`; `isPublic`: `boolean`; `isRecurringTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string`; `name`: `string`; `organizationId`: `string`; `recurringEventId`: `string`; `startAt`: `Date`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

A map of base event templates, keyed by their IDs.

### exceptionsMap

`Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `eventInstanceId`: `string`; `exceptionData`: `unknown`; `exceptionType`: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`; `id`: `string`; `instanceStartTime`: `Date`; `organizationId`: `string`; `recurringEventId`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

A map of event exceptions, keyed by a composite key.

### logger

`FastifyBaseLogger`

The logger for logging warnings or errors.

## Returns

[`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]

An array of fully resolved materialized event instances.
