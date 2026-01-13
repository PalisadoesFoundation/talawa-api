[API Docs](/)

***

# Function: createEmptyAggregatedMetrics()

> **createEmptyAggregatedMetrics**(`options`): [`AggregatedMetrics`](../../types/interfaces/AggregatedMetrics.md)

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/metricsAggregationWorker.ts#L58)

Creates an empty/default AggregatedMetrics object with all fields set to zero or empty values.
Useful for cases where no snapshots are available or as a starting point for aggregation.

## Parameters

### options

Options for creating the empty metrics. Contains windowMinutes (default: 5), timestamp (default: current time), and snapshotCount (default: 0).

#### snapshotCount?

`number`

#### timestamp?

`number`

#### windowMinutes?

`number`

## Returns

[`AggregatedMetrics`](../../types/interfaces/AggregatedMetrics.md)

An empty AggregatedMetrics object with all fields initialized to default values
