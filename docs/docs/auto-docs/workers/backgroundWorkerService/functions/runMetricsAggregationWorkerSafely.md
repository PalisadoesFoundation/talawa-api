[**talawa-api**](../../../README.md)

***

# Function: runMetricsAggregationWorkerSafely()

> **runMetricsAggregationWorkerSafely**(`getMetricsSnapshots`, `windowMinutes`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:255](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/backgroundWorkerService.ts#L255)

Executes the metrics aggregation worker with robust error handling to prevent crashes.

## Parameters

### getMetricsSnapshots

(`windowMinutes?`) => [`PerfSnapshot`](../../../utilities/metrics/performanceTracker/type-aliases/PerfSnapshot.md)[]

### windowMinutes

`number`

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
