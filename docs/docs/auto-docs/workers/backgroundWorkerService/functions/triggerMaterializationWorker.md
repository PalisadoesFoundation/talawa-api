[API Docs](/)

***

# Function: triggerMaterializationWorker()

> **triggerMaterializationWorker**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:190](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L190)

Manually triggers a run of the materialization worker, useful for testing or administrative purposes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>

## Throws

Thrown when the background worker service is not running.
