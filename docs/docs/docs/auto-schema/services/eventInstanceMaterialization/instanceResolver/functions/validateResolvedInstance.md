[Admin Docs](/)

***

# Function: validateResolvedInstance()

> **validateResolvedInstance**(`resolvedInstance`, `logger`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:253](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/instanceResolver.ts#L253)

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
