[Admin Docs](/)

***

# Function: executeMaterialization()

> **executeMaterialization**(`job`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:37](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/workers/eventMaterialization/executionEngine.ts#L37)

Executes the materialization process for a single recurring event job.
This function is the core of the execution engine, handling the creation of event instances.

## Parameters

### job

[`MaterializationJob`](../interfaces/MaterializationJob.md)

The materialization job to execute.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker, such as the database client and logger.

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>

A promise that resolves to a processing result, including metrics and resource usage.
