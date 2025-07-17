[Admin Docs](/)

***

# Function: triggerCleanupWorker()

> **triggerCleanupWorker**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:187](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/backgroundWorkerService.ts#L187)

Manually triggers a run of the cleanup worker, useful for testing or administrative purposes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
