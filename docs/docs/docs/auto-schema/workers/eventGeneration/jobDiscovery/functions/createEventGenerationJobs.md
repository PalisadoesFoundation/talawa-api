[Admin Docs](/)

***

# Function: createEventGenerationJobs()

> **createEventGenerationJobs**(`workloads`): [`EventGenerationJob`](../../executionEngine/interfaces/EventGenerationJob.md)[]

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:115](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/workers/eventGeneration/jobDiscovery.ts#L115)

Converts a list of discovered workloads into an array of executable EventGeneration jobs.
This function uses a unified, date-based approach by normalizing recurrence rules.

## Parameters

### workloads

[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]

An array of discovered workloads to be converted.

## Returns

[`EventGenerationJob`](../../executionEngine/interfaces/EventGenerationJob.md)[]

An array of EventGeneration jobs ready for execution.
