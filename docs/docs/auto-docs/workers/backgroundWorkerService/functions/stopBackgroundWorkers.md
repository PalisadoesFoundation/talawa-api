[API Docs](/)

***

# Function: stopBackgroundWorkers()

> **stopBackgroundWorkers**(`logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:139](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L139)

Stops all running background workers and releases any associated resources.
This function is idempotent and will reset all module-level state even if errors occur.

## Parameters

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
