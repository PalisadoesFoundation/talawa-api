[Admin Docs](/)

***

# Function: validateResolvedInstance()

> **validateResolvedInstance**(`resolvedInstance`, `logger`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:253](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/instanceResolver.ts#L253)

Validates that a resolved materialized instance contains all required fields.
This function helps ensure data integrity before the instance is used elsewhere.

## Parameters

### resolvedInstance

[`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)

The resolved instance to validate.

### logger

`FastifyBaseLogger`

The logger for reporting any missing fields.

## Returns

`boolean`

`true` if the instance is valid, otherwise `false`.
