[**talawa-api**](../../../../README.md)

***

# Function: executePostProcessing()

> **executePostProcessing**(`executionResults`, `_metrics`, `config`, `deps`): `Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

Defined in: [src/workers/eventGeneration/postProcessor.ts:30](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/eventGeneration/postProcessor.ts#L30)

Executes post-processing tasks after the materialization of event instances is complete.
This includes operations like cleaning up old data and logging final statistics.

## Parameters

### executionResults

[`EventGenerationExecutionResult`](../../executionEngine/interfaces/EventGenerationExecutionResult.md)[]

An array of results from the materialization execution.

### \_metrics

[`ProcessingMetrics`](../../types/interfaces/ProcessingMetrics.md)

### config

[`PostProcessingConfig`](../interfaces/PostProcessingConfig.md)

The configuration for post-processing.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker.

## Returns

`Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

- A promise that resolves to the result of the post-processing operations.
