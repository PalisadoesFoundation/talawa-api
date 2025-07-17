[Admin Docs](/)

***

# Function: executePostProcessing()

> **executePostProcessing**(`executionResults`, `metrics`, `config`, `deps`): `Promise`\<[`PostProcessingResult`](../interfaces/PostProcessingResult.md)\>

Defined in: [src/workers/eventMaterialization/postProcessor.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/postProcessor.ts#L22)

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
