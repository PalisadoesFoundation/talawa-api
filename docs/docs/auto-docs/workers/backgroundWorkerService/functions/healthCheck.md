[API Docs](/)

***

# Function: healthCheck()

> **healthCheck**(`schedules?`): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:345](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L345)

Performs a health check of the background worker service, suitable for use by monitoring systems.

## Parameters

### schedules?

Optional object containing the actual schedules used when starting workers.
                   If not provided, falls back to stored schedules or process.env for backward compatibility.

#### cleanupSchedule?

`string`

#### materializationSchedule?

`string`

#### perfAggregationSchedule?

`string`

## Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

- A promise that resolves to an object indicating the health status and any relevant details.
