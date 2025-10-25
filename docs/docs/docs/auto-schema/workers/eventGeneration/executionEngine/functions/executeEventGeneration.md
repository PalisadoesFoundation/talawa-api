[Admin Docs](/)

***

# Function: executeEventGeneration()

> **executeEventGeneration**(`job`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`EventGenerationExecutionResult`](../interfaces/EventGenerationExecutionResult.md)\>\>

Defined in: [src/workers/eventGeneration/executionEngine.ts:37](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/workers/eventGeneration/executionEngine.ts#L37)

Executes the Generation process for a single recurring event job.
This function is the core of the execution engine, handling the creation of event instances.

## Parameters

### job

[`EventGenerationJob`](../interfaces/EventGenerationJob.md)

The Generation job to execute.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker, such as the database client and logger.

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`EventGenerationExecutionResult`](../interfaces/EventGenerationExecutionResult.md)\>\>

A promise that resolves to a processing result, including metrics and resource usage.
