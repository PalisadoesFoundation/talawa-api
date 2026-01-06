[API Docs](/)

***

# Function: resolveMultipleInstances()

> **resolveMultipleInstances**(`instances`, `templatesMap`, `exceptionsMap`, `logger`): [`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]

Defined in: [src/services/eventGeneration/instanceResolver.ts:154](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/instanceResolver.ts#L154)

Resolves multiple generated instances in a batch operation to improve performance.
This function iterates through a list of instances and applies the inheritance and
exception logic to each one.

## Parameters

### instances

`object`[]

An array of generated instances to resolve.

### templatesMap

`Map`\<`string`, \{ `allDay`: `boolean`; `attachmentsPolicy`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `recurrenceRule`: `string` \| `null`; `recurrenceUntil`: `Date` \| `null`; `startAt`: `Date`; `timezone`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

A map of base event templates, keyed by their IDs.

### exceptionsMap

`Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `exceptionData`: `unknown`; `id`: `string`; `organizationId`: `string`; `recurringEventInstanceId`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

A map of event exceptions, keyed by a composite key.

### logger

`FastifyBaseLogger`

The logger for logging warnings or errors.

## Returns

[`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]

An array of fully resolved generated event instances.
