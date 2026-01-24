[API Docs](/)

***

# Interface: TimeSeriesMetrics

Defined in: src/workers/metrics/types.ts:49

Time series metrics for tracking trends over time.

## Extended by

- [`AggregatedMetrics`](AggregatedMetrics.md)

## Properties

### snapshotCount

> **snapshotCount**: `number`

Defined in: src/workers/metrics/types.ts:55

Number of snapshots included in this aggregation

***

### timestamp

> **timestamp**: `number`

Defined in: src/workers/metrics/types.ts:51

Timestamp when metrics were aggregated

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: src/workers/metrics/types.ts:53

Time window in minutes for this aggregation
