[API Docs](/)

***

# Function: executeBatchEventGeneration()

> **executeBatchEventGeneration**(`jobs`, `maxConcurrency`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`EventGenerationExecutionResult`](../interfaces/EventGenerationExecutionResult.md)[]\>\>

Defined in: [src/workers/eventGeneration/executionEngine.ts:122](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/eventGeneration/executionEngine.ts#L122)

Executes multiple Generation jobs in parallel, with a specified level of concurrency.
This function processes jobs in batches to control resource usage and improve throughput.

## Parameters

### jobs

[`EventGenerationJob`](../interfaces/EventGenerationJob.md)[]

An array of Generation jobs to execute.

### maxConcurrency

`number`

The maximum number of jobs to run in parallel.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker.

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`EventGenerationExecutionResult`](../interfaces/EventGenerationExecutionResult.md)[]\>\>

- A promise that resolves to a consolidated processing result for the entire batch.
