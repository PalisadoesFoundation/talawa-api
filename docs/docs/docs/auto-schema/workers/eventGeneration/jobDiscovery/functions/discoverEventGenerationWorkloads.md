[Admin Docs](/)

***

# Function: discoverEventGenerationWorkloads()

> **discoverEventGenerationWorkloads**(`config`, `deps`): `Promise`\<[`DiscoveredWorkload`](../interfaces/DiscoveredWorkload.md)[]\>

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:48](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/workers/eventGeneration/jobDiscovery.ts#L48)

Discovers organizations and their recurring events that require EventGeneration,
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
