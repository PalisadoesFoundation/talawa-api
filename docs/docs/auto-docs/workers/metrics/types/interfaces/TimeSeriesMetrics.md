[API Docs](/)

***

# Interface: TimeSeriesMetrics

Defined in: [src/workers/metrics/types.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L49)

Time series metrics for tracking trends over time.

## Extended by

- [`AggregatedMetrics`](AggregatedMetrics.md)

## Properties

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:55](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L55)

Number of snapshots included in this aggregation

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L51)

Timestamp when metrics were aggregated

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L53)

Time window in minutes for this aggregation
