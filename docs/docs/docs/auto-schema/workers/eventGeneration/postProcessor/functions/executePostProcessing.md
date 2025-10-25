[Admin Docs](/)

***

# Function: executePostProcessing()

> **executePostProcessing**(`executionResults`, `metrics`, `config`, `deps`): `Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

Defined in: [src/workers/eventGeneration/postProcessor.ts:30](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/workers/eventGeneration/postProcessor.ts#L30)

Executes post-processing tasks after the materialization of event instances is complete.
This includes operations like cleaning up old data and logging final statistics.

## Parameters

### executionResults

[`EventGenerationExecutionResult`](../../executionEngine/interfaces/EventGenerationExecutionResult.md)[]

An array of results from the materialization execution.

### metrics

[`ProcessingMetrics`](../../types/interfaces/ProcessingMetrics.md)

The metrics collected during the materialization process.

### config

[`PostProcessingConfig`](../interfaces/PostProcessingConfig.md)

The configuration for post-processing.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker.

## Returns

`Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

A promise that resolves to the result of the post-processing operations.
