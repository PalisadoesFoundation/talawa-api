[API Docs](/)

***

# Function: runCleanupWorkerSafely()

> **runCleanupWorkerSafely**(`drizzleClient`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:153](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L153)

Executes the cleanup worker with robust error handling to ensure stability.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
