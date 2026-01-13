[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/metrics/types.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L53)

Aggregated metrics for a specific time window.
Contains aggregated performance data from multiple request snapshots.

## Extends

- [`TimeSeriesMetrics`](TimeSeriesMetrics.md)

## Properties

### avgComplexityScore?

> `optional` **avgComplexityScore**: `number`

Defined in: [src/workers/metrics/types.ts:73](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L73)

Average GraphQL complexity score (if tracked)

***

### avgTotalMs

> **avgTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L61)

Average total request time in milliseconds

***

### cache

> **cache**: [`CacheMetrics`](CacheMetrics.md)

Defined in: [src/workers/metrics/types.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L57)

Aggregated cache metrics

***

### maxTotalMs

> **maxTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:65](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L65)

Maximum total request time in milliseconds

***

### medianTotalMs

> **medianTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:67](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L67)

Median total request time in milliseconds (p50)

***

### minTotalMs

> **minTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L63)

Minimum total request time in milliseconds

***

### operations

> **operations**: `Record`\<`string`, [`OperationMetrics`](OperationMetrics.md)\>

Defined in: [src/workers/metrics/types.ts:55](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L55)

Aggregated metrics for each operation type

***

### p95TotalMs

> **p95TotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:69](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L69)

95th percentile total request time in milliseconds (p95)

***

### p99TotalMs

> **p99TotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:71](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L71)

99th percentile total request time in milliseconds (p99)

***

### slowOperationCount

> **slowOperationCount**: `number`

Defined in: [src/workers/metrics/types.ts:59](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L59)

Total number of slow operations across all snapshots

***

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L46)

Number of snapshots included in this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`snapshotCount`](TimeSeriesMetrics.md#snapshotcount)

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L42)

Timestamp when this aggregation was performed (milliseconds since epoch)

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`timestamp`](TimeSeriesMetrics.md#timestamp)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L44)

Duration of the aggregation window in minutes

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`windowMinutes`](TimeSeriesMetrics.md#windowminutes)
