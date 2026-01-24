[**talawa-api**](../../../README.md)

***

# Function: cleanupOldInstances()

> **cleanupOldInstances**(`drizzleClient`, `logger`): `Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

Defined in: src/workers/eventCleanupWorker.ts:14

The main method for the cleanup worker, which processes all organizations
and removes instances that have passed their retention period.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

- A promise that resolves to an object with statistics about the cleanup process.
