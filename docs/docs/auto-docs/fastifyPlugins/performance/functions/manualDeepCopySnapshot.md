[API Docs](/)

***

# Function: manualDeepCopySnapshot()

> **manualDeepCopySnapshot**(`snap`): [`PerfSnapshot`](../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)

Defined in: [src/fastifyPlugins/performance.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/performance.ts#L44)

Manual deep copy implementation for performance snapshots.
Creates new objects for ops and slow arrays to ensure full immutability.
Exported for testing purposes to allow direct testing of the fallback path.

## Parameters

### snap

[`PerfSnapshot`](../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)

The snapshot to deep clone

## Returns

[`PerfSnapshot`](../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)

A deep-cloned copy of the snapshot
