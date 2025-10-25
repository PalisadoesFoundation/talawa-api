[Admin Docs](/)

***

# Function: updateMaterializationConfig()

> **updateMaterializationConfig**(`config`, `logger`): `void`

Defined in: [src/workers/backgroundWorkerService.ts:261](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/backgroundWorkerService.ts#L261)

Updates the configuration for the materialization worker at runtime.

## Parameters

### config

`Partial`\<[`WorkerConfig`](../../eventGeneration/eventGenerationPipeline/interfaces/WorkerConfig.md)\>

A partial configuration object with the new settings to apply.

### logger

`FastifyBaseLogger`

## Returns

`void`
