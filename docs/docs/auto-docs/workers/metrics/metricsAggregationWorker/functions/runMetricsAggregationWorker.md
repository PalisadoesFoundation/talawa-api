[**talawa-api**](../../../../README.md)

***

# Function: runMetricsAggregationWorker()

> **runMetricsAggregationWorker**(`snapshotGetter`, `windowMinutes`, `logger`): `Promise`\<[`AggregatedMetrics`](../../types/interfaces/AggregatedMetrics.md) \| `undefined`\>

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:172](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/metricsAggregationWorker.ts#L172)

Runs the metrics aggregation worker to collect and aggregate performance snapshots.

## Parameters

### snapshotGetter

(`windowMinutes?`) => [`PerfSnapshot`](../../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)[]

Function to retrieve performance snapshots (from performance plugin)

### windowMinutes

`number`

Time window in minutes for filtering snapshots (default: 5)

### logger

`FastifyBaseLogger`

Fastify logger instance

## Returns

`Promise`\<[`AggregatedMetrics`](../../types/interfaces/AggregatedMetrics.md) \| `undefined`\>

Aggregated metrics or undefined if no snapshots available
