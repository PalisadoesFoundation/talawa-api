[Admin Docs](/)

***

# Function: getBackgroundWorkerStatus()

> **getBackgroundWorkerStatus**(): `object`

Defined in: [src/workers/backgroundWorkerService.ts:204](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/workers/backgroundWorkerService.ts#L204)

Retrieves the current status of the background worker service, including scheduling information.

## Returns

`object`

An object containing the current status of the service.

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
