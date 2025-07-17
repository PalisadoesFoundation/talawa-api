[Admin Docs](/)

***

# Function: resolveInstanceWithInheritance()

> **resolveInstanceWithInheritance**(`input`): [`ResolvedMaterializedEventInstance`](../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)

Defined in: [src/services/eventInstanceMaterialization/instanceResolver.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/services/eventInstanceMaterialization/instanceResolver.ts#L15)

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
