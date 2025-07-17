[Admin Docs](/)

***

# Function: executeBatchMaterialization()

> **executeBatchMaterialization**(`jobs`, `maxConcurrency`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)[]\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:122](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/workers/eventMaterialization/executionEngine.ts#L122)

Executes multiple materialization jobs in parallel, with a specified level of concurrency.
This function processes jobs in batches to control resource usage and improve throughput.

## Parameters

### jobs

[`MaterializationJob`](../interfaces/MaterializationJob.md)[]

An array of materialization jobs to execute.

### maxConcurrency

`number`

The maximum number of jobs to run in parallel.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker.

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)[]\>\>

A promise that resolves to a consolidated processing result for the entire batch.
