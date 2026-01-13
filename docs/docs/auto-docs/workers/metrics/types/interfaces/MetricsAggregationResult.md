[API Docs](/)

***

# Interface: MetricsAggregationResult

Defined in: [src/workers/metrics/types.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L98)

Result of a metrics aggregation run.

## Properties

### aggregationDurationMs

> **aggregationDurationMs**: `number`

Defined in: [src/workers/metrics/types.ts:104](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L104)

Duration of aggregation in milliseconds

***

### metrics

> **metrics**: [`AggregatedMetrics`](AggregatedMetrics.md)

Defined in: [src/workers/metrics/types.ts:100](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L100)

The aggregated metrics

***

### snapshotsProcessed

> **snapshotsProcessed**: `number`

Defined in: [src/workers/metrics/types.ts:102](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L102)

Number of snapshots processed
