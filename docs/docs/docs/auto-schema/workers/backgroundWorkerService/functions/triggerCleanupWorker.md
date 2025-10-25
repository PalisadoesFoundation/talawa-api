[Admin Docs](/)

***

# Function: triggerCleanupWorker()

> **triggerCleanupWorker**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:187](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/workers/backgroundWorkerService.ts#L187)

Manually triggers a run of the cleanup worker, useful for testing or administrative purposes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
