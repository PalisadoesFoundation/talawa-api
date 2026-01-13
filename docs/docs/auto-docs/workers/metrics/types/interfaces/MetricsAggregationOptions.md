[API Docs](/)

***

# Interface: MetricsAggregationOptions

Defined in: [src/workers/metrics/types.ts:108](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L108)

Options for metrics aggregation.

## Properties

### maxSnapshots?

> `optional` **maxSnapshots**: `number`

Defined in: [src/workers/metrics/types.ts:119](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L119)

Maximum number of snapshots to process (default: 1000)

***

### slowThresholdMs?

> `optional` **slowThresholdMs**: `number`

Defined in: [src/workers/metrics/types.ts:121](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L121)

Threshold in milliseconds for considering an operation as slow (default: 200)

***

### ~~windowMinutes?~~

> `optional` **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:117](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L117)

Time window in minutes to aggregate snapshots from (default: 5).

#### Deprecated

This parameter is currently not functional since PerfSnapshot doesn't include timestamps.
It is accepted for API compatibility but has no effect on filtering.
The snapshots array is already ordered by recency (most recent first).
Use maxSnapshots to limit the number of snapshots processed.
This will be functional in a future PR when timestamps are added to PerfSnapshot.
