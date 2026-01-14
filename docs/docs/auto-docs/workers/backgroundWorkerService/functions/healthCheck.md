[API Docs](/)

***

# Function: healthCheck()

> **healthCheck**(`statusFn`): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:476](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L476)

Performs a health check of the background worker service, suitable for use by monitoring systems.

## Parameters

### statusFn

() => `object`

Optional function to get background worker status (for testing). Defaults to getBackgroundWorkerStatus.

## Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

- A promise that resolves to an object indicating the health status and any relevant details.
