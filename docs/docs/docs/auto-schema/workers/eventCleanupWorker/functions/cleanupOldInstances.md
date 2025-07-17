[Admin Docs](/)

***

# Function: cleanupOldInstances()

> **cleanupOldInstances**(`drizzleClient`, `logger`): `Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:14](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventCleanupWorker.ts#L14)

The main method for the cleanup worker, which processes all organizations
and removes instances that have passed their retention period.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

A promise that resolves to an object with statistics about the cleanup process.
