[API Docs](/)

***

# Function: runMetricsAggregationWorkerSafely()

> **runMetricsAggregationWorkerSafely**(`getMetricsSnapshots`, `windowMinutes`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:266](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L266)

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
