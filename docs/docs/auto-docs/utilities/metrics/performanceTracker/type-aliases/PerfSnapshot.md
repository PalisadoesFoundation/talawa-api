[**talawa-api**](../../../../README.md)

***

# Type Alias: PerfSnapshot

> **PerfSnapshot** = `object`

Defined in: [src/utilities/metrics/performanceTracker.ts:20](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L20)

Snapshot of performance metrics for a single request.

## Properties

### cacheHits

> **cacheHits**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:26](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L26)

Number of cache hits

***

### cacheMisses

> **cacheMisses**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:28](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L28)

Number of cache misses

***

### complexityScore?

> `optional` **complexityScore**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:36](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L36)

GraphQL query complexity score (if tracked)

***

### hitRate

> **hitRate**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:30](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L30)

Cache hit rate (hits / (hits + misses))

***

### ops

> **ops**: `Record`\<`string`, [`OpStats`](OpStats.md)\>

Defined in: [src/utilities/metrics/performanceTracker.ts:32](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L32)

Statistics for each operation type

***

### slow

> **slow**: `object`[]

Defined in: [src/utilities/metrics/performanceTracker.ts:34](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L34)

Slow operations that exceeded the threshold

#### ms

> **ms**: `number`

#### op

> **op**: `string`

***

### totalMs

> **totalMs**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:22](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L22)

Total time spent across all operations in milliseconds

***

### totalOps

> **totalOps**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:24](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L24)

Total number of operations tracked
