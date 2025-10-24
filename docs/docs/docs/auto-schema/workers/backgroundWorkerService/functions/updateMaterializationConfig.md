[Admin Docs](/)

***

# Function: updateMaterializationConfig()

> **updateMaterializationConfig**(`config`, `logger`): `void`

Defined in: [src/workers/backgroundWorkerService.ts:261](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/workers/backgroundWorkerService.ts#L261)

Updates the configuration for the materialization worker at runtime.

## Parameters

### config

`Partial`\<[`WorkerConfig`](../../eventGeneration/eventGenerationPipeline/interfaces/WorkerConfig.md)\>

A partial configuration object with the new settings to apply.

### logger

`FastifyBaseLogger`

## Returns

`void`
