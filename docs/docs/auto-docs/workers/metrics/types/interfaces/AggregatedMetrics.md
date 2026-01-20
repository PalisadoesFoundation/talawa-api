[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/metrics/types.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L61)

Aggregated performance metrics from multiple request snapshots.

## Extends

- [`TimeSeriesMetrics`](TimeSeriesMetrics.md)

## Properties

### cache

> **cache**: [`CacheMetrics`](CacheMetrics.md)

Defined in: [src/workers/metrics/types.ts:80](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L80)

Aggregated cache metrics

***

### complexity?

> `optional` **complexity**: `object`

Defined in: [src/workers/metrics/types.ts:91](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L91)

GraphQL complexity metrics (if available)

#### avgScore

> **avgScore**: `number`

Average complexity score

#### count

> **count**: `number`

Number of requests with complexity tracking

#### maxScore

> **maxScore**: `number`

Maximum complexity score

#### minScore

> **minScore**: `number`

Minimum complexity score

***

### operations

> **operations**: [`OperationMetrics`](OperationMetrics.md)[]

Defined in: [src/workers/metrics/types.ts:82](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L82)

Metrics grouped by operation type

***

### requests

> **requests**: `object`

Defined in: [src/workers/metrics/types.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L63)

Overall request statistics

#### avgTotalMs

> **avgTotalMs**: `number`

Average total request time in milliseconds

#### count

> **count**: `number`

Total number of requests

#### maxTotalMs

> **maxTotalMs**: `number`

Maximum total request time in milliseconds

#### medianTotalMs

> **medianTotalMs**: `number`

Median total request time in milliseconds (p50)

#### minTotalMs

> **minTotalMs**: `number`

Minimum total request time in milliseconds

#### p95TotalMs

> **p95TotalMs**: `number`

95th percentile total request time in milliseconds (p95)

#### p99TotalMs

> **p99TotalMs**: `number`

99th percentile total request time in milliseconds (p99)

***

### slowOperations

> **slowOperations**: `object`

Defined in: [src/workers/metrics/types.ts:84](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L84)

Slow operations summary

#### byOperation

> **byOperation**: `Record`\<`string`, `number`\>

Slow operations grouped by operation name

#### count

> **count**: `number`

Total number of slow operations

***

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:55](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L55)

Number of snapshots included in this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`snapshotCount`](TimeSeriesMetrics.md#snapshotcount)

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L51)

Timestamp when metrics were aggregated

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`timestamp`](TimeSeriesMetrics.md#timestamp)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L53)

Time window in minutes for this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`windowMinutes`](TimeSeriesMetrics.md#windowminutes)
