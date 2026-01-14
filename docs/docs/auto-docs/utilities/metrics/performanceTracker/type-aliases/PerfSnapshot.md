[**talawa-api**](../../../../README.md)

***

# Type Alias: PerfSnapshot

> **PerfSnapshot** = `object`

Defined in: [src/utilities/metrics/performanceTracker.ts:20](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L20)

Snapshot of performance metrics for a single request.

## Properties

### cacheHits

> **cacheHits**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:24](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L24)

Number of cache hits

***

### cacheMisses

> **cacheMisses**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:26](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L26)

Number of cache misses

***

### ops

> **ops**: `Record`\<`string`, [`OpStats`](OpStats.md)\>

Defined in: [src/utilities/metrics/performanceTracker.ts:28](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L28)

Statistics for each operation type

***

### totalMs

> **totalMs**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:22](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L22)

Total time spent across all operations in milliseconds
