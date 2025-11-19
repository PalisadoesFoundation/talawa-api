[API Docs](/)

***

# Function: runMaterializationWorkerSafely()

> **runMaterializationWorkerSafely**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: src/workers/backgroundWorkerService.ts:110

Executes the materialization worker with robust error handling to prevent crashes.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
