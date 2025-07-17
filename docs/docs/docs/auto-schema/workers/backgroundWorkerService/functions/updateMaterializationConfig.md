[Admin Docs](/)

***

# Function: updateMaterializationConfig()

> **updateMaterializationConfig**(`config`, `logger`): `void`

Defined in: [src/workers/backgroundWorkerService.ts:261](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/backgroundWorkerService.ts#L261)

Updates the configuration for the materialization worker at runtime.

## Parameters

### config

`Partial`\<[`WorkerConfig`](../../eventMaterialization/materializationPipeline/interfaces/WorkerConfig.md)\>

A partial configuration object with the new settings to apply.

### logger

`FastifyBaseLogger`

## Returns

`void`
