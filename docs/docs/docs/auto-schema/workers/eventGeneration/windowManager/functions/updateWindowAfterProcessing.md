[Admin Docs](/)

***

# Function: updateWindowAfterProcessing()

> **updateWindowAfterProcessing**(`windowId`, `processingResult`, `deps`): `Promise`\<`void`\>

Defined in: [src/workers/eventGeneration/windowManager.ts:90](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventGeneration/windowManager.ts#L90)

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
