[Admin Docs](/)

***

# Function: executeMaterialization()

> **executeMaterialization**(`job`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:29](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/executionEngine.ts#L29)

Executes materialization for a single organization's events

## Parameters

### job

[`MaterializationJob`](../interfaces/MaterializationJob.md)

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>
