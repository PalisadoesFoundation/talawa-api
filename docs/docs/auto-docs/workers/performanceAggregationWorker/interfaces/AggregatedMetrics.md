[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/performanceAggregationWorker.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L6)

Aggregated performance metrics for a time period.

## Properties

### avgDbMs

> **avgDbMs**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L16)

Average database operation time (ms)

***

### avgHitRate

> **avgHitRate**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L22)

Average cache hit rate

***

### avgRequestMs

> **avgRequestMs**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L14)

Average request duration (ms)

***

### highComplexityCount

> **highComplexityCount**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L26)

Number of high complexity queries (>=100)

***

### periodEnd

> **periodEnd**: `Date`

Defined in: [src/workers/performanceAggregationWorker.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L10)

Time period end timestamp

***

### periodStart

> **periodStart**: `Date`

Defined in: [src/workers/performanceAggregationWorker.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L8)

Time period start timestamp

***

### slowRequestCount

> **slowRequestCount**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L24)

Number of slow requests (>500ms)

***

### topSlowOps

> **topSlowOps**: `object`[]

Defined in: [src/workers/performanceAggregationWorker.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L28)

Most common slow operations

#### avgMs

> **avgMs**: `number`

#### count

> **count**: `number`

#### op

> **op**: `string`

***

### totalCacheHits

> **totalCacheHits**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L18)

Total cache hits

***

### totalCacheMisses

> **totalCacheMisses**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L20)

Total cache misses

***

### totalRequests

> **totalRequests**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L12)

Total number of requests in this period
