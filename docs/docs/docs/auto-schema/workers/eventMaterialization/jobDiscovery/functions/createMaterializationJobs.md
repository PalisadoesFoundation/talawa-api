[Admin Docs](/)

***

# Function: createMaterializationJobs()

> **createMaterializationJobs**(`workloads`): [`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:99](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L99)

Converts discovered workloads into executable materialization jobs

## Parameters

### workloads

[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]

## Returns

[`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]
