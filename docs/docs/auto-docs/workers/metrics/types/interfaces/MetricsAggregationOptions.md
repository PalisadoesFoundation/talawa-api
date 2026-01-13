[API Docs](/)

***

# Interface: MetricsAggregationOptions

Defined in: [src/workers/metrics/types.ts:79](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L79)

Options for metrics aggregation.

## Properties

### maxSnapshots?

> `optional` **maxSnapshots**: `number`

Defined in: [src/workers/metrics/types.ts:88](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L88)

Maximum number of snapshots to process (default: 1000)

***

### slowThresholdMs?

> `optional` **slowThresholdMs**: `number`

Defined in: [src/workers/metrics/types.ts:90](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L90)

Threshold in milliseconds for considering an operation as slow (default: 200)

***

### windowMinutes?

> `optional` **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:86](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L86)

Time window in minutes to aggregate snapshots from (default: 5).
Note: Currently not used for filtering since PerfSnapshot doesn't include timestamps.
The snapshots array is already ordered by recency (most recent first).
Use maxSnapshots to limit the number of snapshots processed.
