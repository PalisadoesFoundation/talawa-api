[API Docs](/)

***

# Type Alias: PerfSnapshot

> **PerfSnapshot** = `object`

Defined in: src/utilities/metrics/performanceTracker.ts:20

Snapshot of performance metrics for a single request.

## Properties

### cacheHits

> **cacheHits**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:26

Number of cache hits

***

### cacheMisses

> **cacheMisses**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:28

Number of cache misses

***

### complexityScore?

> `optional` **complexityScore**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:36

GraphQL query complexity score (if tracked)

***

### hitRate

> **hitRate**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:30

Cache hit rate (hits / (hits + misses))

***

### ops

> **ops**: `Record`\<`string`, [`OpStats`](OpStats.md)\>

Defined in: src/utilities/metrics/performanceTracker.ts:32

Statistics for each operation type

***

### slow

> **slow**: `object`[]

Defined in: src/utilities/metrics/performanceTracker.ts:34

Slow operations that exceeded the threshold

#### ms

> **ms**: `number`

#### op

> **op**: `string`

***

### totalMs

> **totalMs**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:22

Total time spent across all operations in milliseconds

***

### totalOps

> **totalOps**: `number`

Defined in: src/utilities/metrics/performanceTracker.ts:24

Total number of operations tracked
