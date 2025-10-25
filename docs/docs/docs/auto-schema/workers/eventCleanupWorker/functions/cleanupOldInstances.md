[Admin Docs](/)

***

# Function: cleanupOldInstances()

> **cleanupOldInstances**(`drizzleClient`, `logger`): `Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:14](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventCleanupWorker.ts#L14)

The main method for the cleanup worker, which processes all organizations
and removes instances that have passed their retention period.

## Parameters

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

A promise that resolves to an object with statistics about the cleanup process.
