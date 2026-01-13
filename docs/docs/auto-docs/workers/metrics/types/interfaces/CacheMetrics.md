[API Docs](/)

***

# Interface: CacheMetrics

Defined in: [src/workers/metrics/types.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L26)

Cache metrics aggregated across multiple snapshots.

## Properties

### hitRate

> **hitRate**: `number`

Defined in: [src/workers/metrics/types.ts:34](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L34)

Cache hit rate (hits / totalOps)

***

### totalHits

> **totalHits**: `number`

Defined in: [src/workers/metrics/types.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L28)

Total number of cache hits

***

### totalMisses

> **totalMisses**: `number`

Defined in: [src/workers/metrics/types.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L30)

Total number of cache misses

***

### totalOps

> **totalOps**: `number`

Defined in: [src/workers/metrics/types.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L32)

Total cache operations (hits + misses)
