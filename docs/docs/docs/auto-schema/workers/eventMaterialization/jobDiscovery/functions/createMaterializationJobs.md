[Admin Docs](/)

***

# Function: createMaterializationJobs()

> **createMaterializationJobs**(`workloads`): [`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:115](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventMaterialization/jobDiscovery.ts#L115)

Converts a list of discovered workloads into an array of executable materialization jobs.
This function uses a unified, date-based approach by normalizing recurrence rules.

## Parameters

### workloads

[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]

An array of discovered workloads to be converted.

## Returns

[`MaterializationJob`](../../executionEngine/interfaces/MaterializationJob.md)[]

An array of materialization jobs ready for execution.
