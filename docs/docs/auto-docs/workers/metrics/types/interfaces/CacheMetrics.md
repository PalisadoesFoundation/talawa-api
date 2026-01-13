[API Docs](/)

***

# Interface: CacheMetrics

Defined in: [src/workers/metrics/types.ts:55](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L55)

Cache metrics aggregated across multiple snapshots.

## Properties

### hitRate

> **hitRate**: `number`

Defined in: [src/workers/metrics/types.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L63)

Cache hit rate (hits / totalOps)

***

### totalHits

> **totalHits**: `number`

Defined in: [src/workers/metrics/types.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L57)

Total number of cache hits

***

### totalMisses

> **totalMisses**: `number`

Defined in: [src/workers/metrics/types.ts:59](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L59)

Total number of cache misses

***

### totalOps

> **totalOps**: `number`

Defined in: [src/workers/metrics/types.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L61)

Total cache operations (hits + misses)
