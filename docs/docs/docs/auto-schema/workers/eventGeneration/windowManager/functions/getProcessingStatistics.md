[Admin Docs](/)

***

# Function: getProcessingStatistics()

> **getProcessingStatistics**(`deps`): `Promise`\<\{ `averageInstancesPerRun`: `number`; `enabledOrganizations`: `number`; `lastProcessingRun`: `null` \| `Date`; `organizationsNeedingProcessing`: `number`; `totalOrganizations`: `number`; \}\>

Defined in: [src/workers/eventGeneration/windowManager.ts:274](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/workers/eventGeneration/windowManager.ts#L274)

Gets processing statistics for all organizations

## Parameters

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<\{ `averageInstancesPerRun`: `number`; `enabledOrganizations`: `number`; `lastProcessingRun`: `null` \| `Date`; `organizationsNeedingProcessing`: `number`; `totalOrganizations`: `number`; \}\>
