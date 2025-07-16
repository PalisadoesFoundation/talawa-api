[Admin Docs](/)

***

# Function: executePostProcessing()

> **executePostProcessing**(`executionResults`, `metrics`, `config`, `deps`): `Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

Defined in: [src/workers/eventMaterialization/postProcessor.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/postProcessor.ts#L22)

Performs post-processing after materialization execution

## Parameters

### executionResults

[`MaterializationExecutionResult`](../../executionEngine/interfaces/MaterializationExecutionResult.md)[]

### metrics

[`ProcessingMetrics`](../../types/interfaces/ProcessingMetrics.md)

### config

[`PostProcessingConfig`](../interfaces/PostProcessingConfig.md)

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>
