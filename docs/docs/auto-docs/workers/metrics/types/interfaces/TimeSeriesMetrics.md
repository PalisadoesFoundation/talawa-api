[API Docs](/)

***

# Interface: TimeSeriesMetrics

Defined in: [src/workers/metrics/types.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L44)

Time series metrics for tracking trends over time.

## Extended by

- [`AggregatedMetrics`](AggregatedMetrics.md)

## Properties

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L50)

Number of snapshots included in this aggregation

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L46)

Timestamp when metrics were aggregated

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L48)

Time window in minutes for this aggregation
