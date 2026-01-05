[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/performanceAggregationWorker.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L48)

Aggregated performance metrics for a time period.

## Properties

### avgDbMs

> **avgDbMs**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L58)

Average database operation time (ms)

***

### avgHitRate

> **avgHitRate**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:64](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L64)

Average cache hit rate

***

### avgRequestMs

> **avgRequestMs**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L56)

Average request duration (ms)

***

### highComplexityCount

> **highComplexityCount**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:68](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L68)

Number of high complexity queries (>=100)

***

### periodEnd

> **periodEnd**: `Date`

Defined in: [src/workers/performanceAggregationWorker.ts:52](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L52)

Time period end timestamp

***

### periodStart

> **periodStart**: `Date`

Defined in: [src/workers/performanceAggregationWorker.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L50)

Time period start timestamp

***

### slowRequestCount

> **slowRequestCount**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:66](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L66)

Number of slow requests (>500ms)

***

### topSlowOps

> **topSlowOps**: `object`[]

Defined in: [src/workers/performanceAggregationWorker.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L70)

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

Defined in: [src/workers/performanceAggregationWorker.ts:60](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L60)

Total cache hits

***

### totalCacheMisses

> **totalCacheMisses**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:62](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L62)

Total cache misses

***

### totalRequests

> **totalRequests**: `number`

Defined in: [src/workers/performanceAggregationWorker.ts:54](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/performanceAggregationWorker.ts#L54)

Total number of requests in this period
