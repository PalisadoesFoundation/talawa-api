[Admin Docs](/)

***

# Function: createMaterializationJobs()

> **createMaterializationJobs**(`workloads`): [`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:99](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/jobDiscovery.ts#L99)

Converts discovered workloads into executable materialization jobs

## Parameters

### workloads

[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]

## Returns

[`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]
