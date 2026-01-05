[API Docs](/)

***

# Function: triggerCleanupWorker()

> **triggerCleanupWorker**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:207](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L207)

Manually triggers a run of the cleanup worker, useful for testing or administrative purposes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
