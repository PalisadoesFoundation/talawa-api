[API Docs](/)

***

# Function: aggregateMetrics()

> **aggregateMetrics**(`snapshots`, `options`): [`MetricsAggregationResult`](../../types/interfaces/MetricsAggregationResult.md)

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:246](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/metricsAggregationWorker.ts#L246)

Aggregates performance metrics from a collection of snapshots.

## Parameters

### snapshots

[`PerfSnapshot`](../../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)[]

Array of performance snapshots to aggregate

### options

[`MetricsAggregationOptions`](../../types/interfaces/MetricsAggregationOptions.md) = `{}`

Aggregation options. Note: windowMinutes is deprecated and not functional since PerfSnapshot lacks timestamps. Use maxSnapshots instead.

## Returns

[`MetricsAggregationResult`](../../types/interfaces/MetricsAggregationResult.md)

Aggregated metrics result
