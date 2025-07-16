[Admin Docs](/)

***

# Function: resolveInstanceWithInheritance()

> **resolveInstanceWithInheritance**(`input`): [`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/services/eventInstanceMaterialization/instanceResolver.ts#L15)

Resolves a single materialized instance with inheritance from base template + exception.

This is the core inheritance logic:
1. Start with base template properties
2. Apply exception overrides if they exist
3. Return fully resolved instance

## Parameters

### input

[`ResolveInstanceInput`](../../types/interfaces/ResolveInstanceInput.md)

## Returns

[`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)
