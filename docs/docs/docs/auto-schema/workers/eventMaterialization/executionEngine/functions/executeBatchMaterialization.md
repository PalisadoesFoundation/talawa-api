[Admin Docs](/)

***

# Function: executeBatchMaterialization()

> **executeBatchMaterialization**(`jobs`, `maxConcurrency`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)[]\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:108](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/executionEngine.ts#L108)

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
