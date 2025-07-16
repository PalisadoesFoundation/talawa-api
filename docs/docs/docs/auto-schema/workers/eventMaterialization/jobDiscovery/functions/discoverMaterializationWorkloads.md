[Admin Docs](/)

***

# Function: discoverMaterializationWorkloads()

> **discoverMaterializationWorkloads**(`config`, `deps`): `Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:36](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/jobDiscovery.ts#L36)

Discovers organizations and events that need materialization

## Parameters

### config

[`JobDiscoveryConfig`](../interfaces/JobDiscoveryConfig.md)

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>
