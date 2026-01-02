[API Docs](/)

***

# Function: healthCheck()

> **healthCheck**(`logger?`, `getStatusVal?`): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:240](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L240)

Performs a health check of the background worker service, suitable for use by monitoring systems.

## Parameters

### logger?

`FastifyBaseLogger`

Optional Fastify logger for error logging. If not provided, errors will not be logged.

### getStatusVal?

() => `object`

**`Internal`**

For testing purposes only

## Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

- A promise that resolves to an object indicating the health status and any relevant details.
