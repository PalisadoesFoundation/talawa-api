[Admin Docs](/)

***

# Function: executeBatchMaterialization()

> **executeBatchMaterialization**(`jobs`, `maxConcurrency`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)[]\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:108](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/executionEngine.ts#L108)

Executes multiple materialization jobs in parallel

## Parameters

### jobs

[`MaterializationJob`](../interfaces/MaterializationJob.md)[]

### maxConcurrency

`number`

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)[]\>\>
