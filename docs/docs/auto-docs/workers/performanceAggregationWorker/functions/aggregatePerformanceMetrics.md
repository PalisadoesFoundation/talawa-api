[API Docs](/)

***

# Function: aggregatePerformanceMetrics()

> **aggregatePerformanceMetrics**(`fastify`, `logger`): `Promise`\<[`AggregatedMetrics`](../interfaces/AggregatedMetrics.md)\>

Defined in: [src/workers/performanceAggregationWorker.ts:39](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L39)

Aggregates performance metrics from recent snapshots and logs summary.
This worker should be called periodically to provide aggregated performance insights.

## Parameters

### fastify

`FastifyInstance`

Fastify instance with perfAggregate data

### logger

`FastifyBaseLogger`

Logger instance

## Returns

`Promise`\<[`AggregatedMetrics`](../interfaces/AggregatedMetrics.md)\>

Aggregated metrics for the period
