[API Docs](/)

***

# Interface: TimeSeriesMetrics

Defined in: [src/workers/metrics/types.ts:69](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L69)

Time series metrics for tracking metrics over time windows.

## Extended by

- [`AggregatedMetrics`](AggregatedMetrics.md)

## Properties

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:75](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L75)

Number of snapshots included in this aggregation

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:71](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L71)

Timestamp when this aggregation was performed (milliseconds since epoch)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:73](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L73)

Duration of the aggregation window in minutes
