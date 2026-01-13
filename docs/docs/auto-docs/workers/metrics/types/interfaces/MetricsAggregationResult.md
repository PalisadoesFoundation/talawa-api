[API Docs](/)

***

# Interface: MetricsAggregationResult

Defined in: [src/workers/metrics/types.ts:127](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L127)

Result of a metrics aggregation run.

## Properties

### aggregationDurationMs

> **aggregationDurationMs**: `number`

Defined in: [src/workers/metrics/types.ts:133](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L133)

Duration of aggregation in milliseconds

***

### error?

> `optional` **error**: `string` \| `Error`

Defined in: [src/workers/metrics/types.ts:139](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L139)

Error that occurred during aggregation, if any.
When present, indicates that aggregation failed (e.g., `getSnapshots` or `aggregateMetrics` threw).
When undefined, indicates successful aggregation (even if no snapshots were available).

***

### metrics

> **metrics**: [`AggregatedMetrics`](AggregatedMetrics.md)

Defined in: [src/workers/metrics/types.ts:129](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L129)

The aggregated metrics

***

### snapshotsProcessed

> **snapshotsProcessed**: `number`

Defined in: [src/workers/metrics/types.ts:131](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L131)

Number of snapshots processed
