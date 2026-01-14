[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/metrics/types.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L56)

Aggregated performance metrics from multiple request snapshots.

## Extends

- [`TimeSeriesMetrics`](TimeSeriesMetrics.md)

## Properties

### cache

> **cache**: [`CacheMetrics`](CacheMetrics.md)

Defined in: [src/workers/metrics/types.ts:75](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L75)

Aggregated cache metrics

***

### complexity?

> `optional` **complexity**: `object`

Defined in: [src/workers/metrics/types.ts:86](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L86)

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

Defined in: [src/workers/metrics/types.ts:77](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L77)

Metrics grouped by operation type

***

### requests

> **requests**: `object`

Defined in: [src/workers/metrics/types.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L58)

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

Defined in: [src/workers/metrics/types.ts:79](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L79)

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

Defined in: [src/workers/metrics/types.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L50)

Number of snapshots included in this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`snapshotCount`](TimeSeriesMetrics.md#snapshotcount)

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L46)

Timestamp when metrics were aggregated

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`timestamp`](TimeSeriesMetrics.md#timestamp)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L48)

Time window in minutes for this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`windowMinutes`](TimeSeriesMetrics.md#windowminutes)
