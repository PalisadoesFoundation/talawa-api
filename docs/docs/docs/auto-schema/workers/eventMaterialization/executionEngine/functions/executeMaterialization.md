[Admin Docs](/)

***

# Function: executeMaterialization()

> **executeMaterialization**(`job`, `deps`): `Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>

Defined in: [src/workers/eventMaterialization/executionEngine.ts:29](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/executionEngine.ts#L29)

Executes materialization for a single organization's events

## Parameters

### job

[`MaterializationJob`](../interfaces/MaterializationJob.md)

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`ProcessingResult`](../../types/interfaces/ProcessingResult.md)\<[`MaterializationExecutionResult`](../interfaces/MaterializationExecutionResult.md)\>\>
