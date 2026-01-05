[API Docs](/)

***

# Function: getBackgroundWorkerStatus()

> **getBackgroundWorkerStatus**(`schedules?`): `object`

Defined in: [src/workers/backgroundWorkerService.ts:300](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L300)

Retrieves the current status of the background worker service, including scheduling information.

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

`object`

- An object containing the current status of the service.

### cleanupSchedule

> **cleanupSchedule**: `string`

### isRunning

> **isRunning**: `boolean`

### materializationSchedule

> **materializationSchedule**: `string`

### nextCleanupRun?

> `optional` **nextCleanupRun**: `Date`

### nextMaterializationRun?

> `optional` **nextMaterializationRun**: `Date`

### perfAggregationSchedule

> **perfAggregationSchedule**: `string`
