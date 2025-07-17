[Admin Docs](/)

***

# Function: discoverMaterializationWorkloads()

> **discoverMaterializationWorkloads**(`config`, `deps`): `Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L41)

Discovers organizations and events that need materialization

## Parameters

### config

[`JobDiscoveryConfig`](../interfaces/JobDiscoveryConfig.md)

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

## Returns

`Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>
