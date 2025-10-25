[Admin Docs](/)

***

# Function: healthCheck()

> **healthCheck**(): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:224](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/backgroundWorkerService.ts#L224)

Performs a health check of the background worker service, suitable for use by monitoring systems.

## Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

A promise that resolves to an object indicating the health status and any relevant details.
