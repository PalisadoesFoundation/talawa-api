[API Docs](/)

***

# Interface: TimeSeriesMetrics

Defined in: [src/workers/metrics/types.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L40)

Time series metrics for tracking metrics over time windows.

## Extended by

- [`AggregatedMetrics`](AggregatedMetrics.md)

## Properties

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L46)

Number of snapshots included in this aggregation

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L42)

Timestamp when this aggregation was performed (milliseconds since epoch)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L44)

Duration of the aggregation window in minutes
