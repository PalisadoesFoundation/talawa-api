[Admin Docs](/)

***

# Function: createExceptionLookupMap()

> **createExceptionLookupMap**(`exceptions`): `Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `eventInstanceId`: `string`; `exceptionData`: `unknown`; `exceptionType`: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`; `id`: `string`; `instanceStartTime`: `Date`; `organizationId`: `string`; `recurringEventId`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:207](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/instanceResolver.ts#L207)

Creates a lookup map for event exceptions to enable efficient batch processing.
The map is keyed by a composite key of the recurring event ID and instance start time.

## Parameters

### exceptions

`object`[]

An array of event exceptions.

## Returns

`Map`\<`string`, \{ `createdAt`: `Date`; `creatorId`: `string`; `eventInstanceId`: `string`; `exceptionData`: `unknown`; `exceptionType`: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`; `id`: `string`; `instanceStartTime`: `Date`; `organizationId`: `string`; `recurringEventId`: `string`; `updatedAt`: `Date`; `updaterId`: `string`; \}\>

A map of exceptions, keyed for quick lookup.
