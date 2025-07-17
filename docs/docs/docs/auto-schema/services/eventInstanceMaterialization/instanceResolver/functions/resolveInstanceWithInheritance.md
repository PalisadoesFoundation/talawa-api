[Admin Docs](/)

***

# Function: resolveInstanceWithInheritance()

> **resolveInstanceWithInheritance**(`input`): [`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/instanceResolver.ts#L15)

Resolves a single materialized instance by combining the properties of the base event template
with any applicable exceptions. This function forms the core of the inheritance logic,
ensuring that each instance accurately reflects its intended state.

## Parameters

### input

[`ResolveInstanceInput`](../../types/interfaces/ResolveInstanceInput.md)

An object containing the materialized instance, base template, and optional exception.

## Returns

[`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)

A fully resolved materialized event instance with all properties correctly inherited and overridden.
