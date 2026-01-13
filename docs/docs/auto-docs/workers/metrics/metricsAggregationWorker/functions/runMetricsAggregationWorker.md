[API Docs](/)

***

# Function: runMetricsAggregationWorker()

> **runMetricsAggregationWorker**(`getSnapshots`, `logger`, `options`): `Promise`\<[`MetricsAggregationResult`](../../types/interfaces/MetricsAggregationResult.md)\>

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:348](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/metricsAggregationWorker.ts#L348)

Runs the metrics aggregation worker.
Collects recent performance snapshots and aggregates them into metrics.

## Parameters

### getSnapshots

() => [`PerfSnapshot`](../../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)[]

Function to retrieve recent performance snapshots

### logger

`FastifyBaseLogger`

Logger instance for logging

### options

[`MetricsAggregationOptions`](../../types/interfaces/MetricsAggregationOptions.md) = `{}`

Aggregation options. Note: windowMinutes is deprecated and not functional since PerfSnapshot lacks timestamps. Use maxSnapshots instead.

## Returns

`Promise`\<[`MetricsAggregationResult`](../../types/interfaces/MetricsAggregationResult.md)\>

Aggregated metrics result
