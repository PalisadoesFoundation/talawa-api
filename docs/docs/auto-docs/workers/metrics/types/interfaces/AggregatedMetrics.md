[API Docs](/)

***

# Interface: AggregatedMetrics

Defined in: [src/workers/metrics/types.ts:82](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L82)

Aggregated metrics for a specific time window.
Contains aggregated performance data from multiple request snapshots.

## Extends

- [`TimeSeriesMetrics`](TimeSeriesMetrics.md)

## Properties

### avgComplexityScore?

> `optional` **avgComplexityScore**: `number`

Defined in: [src/workers/metrics/types.ts:102](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L102)

Average GraphQL complexity score (if tracked)

***

### avgTotalMs

> **avgTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:90](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L90)

Average total request time in milliseconds

***

### cache

> **cache**: [`CacheMetrics`](CacheMetrics.md)

Defined in: [src/workers/metrics/types.ts:86](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L86)

Aggregated cache metrics

***

### maxTotalMs

> **maxTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:94](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L94)

Maximum total request time in milliseconds

***

### medianTotalMs

> **medianTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:96](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L96)

Median total request time in milliseconds (p50)

***

### minTotalMs

> **minTotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:92](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L92)

Minimum total request time in milliseconds

***

### operations

> **operations**: `Record`\<`string`, [`OperationMetrics`](OperationMetrics.md)\>

Defined in: [src/workers/metrics/types.ts:84](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L84)

Aggregated metrics for each operation type

***

### p95TotalMs

> **p95TotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L98)

95th percentile total request time in milliseconds (p95)

***

### p99TotalMs

> **p99TotalMs**: `number`

Defined in: [src/workers/metrics/types.ts:100](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L100)

99th percentile total request time in milliseconds (p99)

***

### slowOperationCount

> **slowOperationCount**: `number`

Defined in: [src/workers/metrics/types.ts:88](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L88)

Total number of slow operations across all snapshots

***

### snapshotCount

> **snapshotCount**: `number`

Defined in: [src/workers/metrics/types.ts:75](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L75)

Number of snapshots included in this aggregation

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`snapshotCount`](TimeSeriesMetrics.md#snapshotcount)

***

### timestamp

> **timestamp**: `number`

Defined in: [src/workers/metrics/types.ts:71](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L71)

Timestamp when this aggregation was performed (milliseconds since epoch)

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`timestamp`](TimeSeriesMetrics.md#timestamp)

***

### windowMinutes

> **windowMinutes**: `number`

Defined in: [src/workers/metrics/types.ts:73](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L73)

Duration of the aggregation window in minutes

#### Inherited from

[`TimeSeriesMetrics`](TimeSeriesMetrics.md).[`windowMinutes`](TimeSeriesMetrics.md#windowminutes)
