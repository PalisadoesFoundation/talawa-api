[Admin Docs](/)

***

# Function: updateWindowAfterProcessing()

> **updateWindowAfterProcessing**(`windowId`, `processingResult`, `deps`): `Promise`\<`void`\>

Defined in: [src/workers/eventMaterialization/windowManager.ts:96](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventMaterialization/windowManager.ts#L96)

Updates the materialization window after successful processing.

## Parameters

### windowId

`string`

### processingResult

[`WindowProcessingResult`](../interfaces/WindowProcessingResult.md)

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<`void`\>
