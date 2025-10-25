[Admin Docs](/)

***

# Function: resolveMultipleInstances()

> **resolveMultipleInstances**(`instances`, `templatesMap`, `exceptionsMap`, `logger`): [`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]

Defined in: [src/services/eventGeneration/instanceResolver.ts:151](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/services/eventGeneration/instanceResolver.ts#L151)

Resolves multiple generated instances in a batch operation to improve performance.
This function iterates through a list of instances and applies the inheritance and
exception logic to each one.

## Parameters

### instances

`object`[]

An array of generated instances to resolve.

### templatesMap

`Map`\<`string`, \{ `allDay`: `boolean`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `id`: `string`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

A map of base event templates, keyed by their IDs.

### exceptionsMap

`Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>

A map of event exceptions, keyed by a composite key.

### logger

`FastifyBaseLogger`

The logger for logging warnings or errors.

## Returns

[`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]

An array of fully resolved generated event instances.
