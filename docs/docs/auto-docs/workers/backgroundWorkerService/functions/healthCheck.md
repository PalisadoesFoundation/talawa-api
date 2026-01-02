[API Docs](/)

***

# Function: healthCheck()

> **healthCheck**(`logger?`): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:239](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L239)

Performs a health check of the background worker service, suitable for use by monitoring systems.

## Parameters

### logger?

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

- A promise that resolves to an object indicating the health status and any relevant details.
