[Admin Docs](/)

***

# Function: getProcessingStatistics()

> **getProcessingStatistics**(`deps`): `Promise`\<\{ `averageInstancesPerRun`: `number`; `enabledOrganizations`: `number`; `lastProcessingRun`: `Date`; `organizationsNeedingProcessing`: `number`; `totalOrganizations`: `number`; \}\>

Defined in: [src/workers/eventMaterialization/windowManager.ts:283](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventMaterialization/windowManager.ts#L283)

Gets processing statistics for all organizations

## Parameters

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<\{ `averageInstancesPerRun`: `number`; `enabledOrganizations`: `number`; `lastProcessingRun`: `Date`; `organizationsNeedingProcessing`: `number`; `totalOrganizations`: `number`; \}\>
