[Admin Docs](/)

***

# Function: createMaterializationJobs()

> **createMaterializationJobs**(`workloads`): [`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:104](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L104)

Converts discovered workloads into executable materialization jobs with unified date-based approach

## Parameters

### workloads

[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]

## Returns

[`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]
