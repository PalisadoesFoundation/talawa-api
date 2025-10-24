[Admin Docs](/)

***

# Function: triggerMaterializationWorker()

> **triggerMaterializationWorker**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:172](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/workers/backgroundWorkerService.ts#L172)

Manually triggers a run of the materialization worker, useful for testing or administrative purposes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
