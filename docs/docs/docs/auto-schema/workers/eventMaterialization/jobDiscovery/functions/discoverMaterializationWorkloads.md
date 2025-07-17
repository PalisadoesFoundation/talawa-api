[Admin Docs](/)

***

# Function: discoverMaterializationWorkloads()

> **discoverMaterializationWorkloads**(`config`, `deps`): `Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:48](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventMaterialization/jobDiscovery.ts#L48)

Discovers organizations and their recurring events that require materialization,
creating a prioritized list of workloads.

## Parameters

### config

[`JobDiscoveryConfig`](../interfaces/JobDiscoveryConfig.md)

The configuration for the job discovery process.

### deps

[`WorkerDependencies`](../../types/interfaces/WorkerDependencies.md)

The dependencies required for the worker, such as the database client and logger.

## Returns

`Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>

A promise that resolves to an array of discovered workloads, sorted by priority.
