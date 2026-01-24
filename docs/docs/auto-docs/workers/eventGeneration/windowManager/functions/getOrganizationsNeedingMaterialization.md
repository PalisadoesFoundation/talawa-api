[**talawa-api**](../../../../README.md)

***

# Function: getOrganizationsNeedingMaterialization()

> **getOrganizationsNeedingMaterialization**(`config`, `deps`): `Promise`\<`object`[]\>

Defined in: src/workers/eventGeneration/windowManager.ts:45

Gets organizations that need materialization processing.
This includes organizations where:
- Window end date is approaching (less than 1 month ahead)
- Haven't been processed recently
- Are enabled for materialization
- Special handling for never-ending events (more frequent processing)

## Parameters

### config

[`WindowProcessingConfig`](../interfaces/WindowProcessingConfig.md)

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<`object`[]\>
