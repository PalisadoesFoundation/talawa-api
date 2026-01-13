[API Docs](/)

***

# Interface: OperationMetrics

Defined in: [src/workers/metrics/types.ts:4](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L4)

Statistics for a specific operation type aggregated across multiple snapshots.

## Properties

### avgMs

> **avgMs**: `number`

Defined in: [src/workers/metrics/types.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L10)

Average time in milliseconds per execution

***

### count

> **count**: `number`

Defined in: [src/workers/metrics/types.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L6)

Number of times this operation was executed

***

### maxMs

> **maxMs**: `number`

Defined in: [src/workers/metrics/types.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L14)

Maximum time in milliseconds for a single execution

***

### medianMs

> **medianMs**: `number`

Defined in: [src/workers/metrics/types.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L16)

Median time in milliseconds (p50)

***

### minMs

> **minMs**: `number`

Defined in: [src/workers/metrics/types.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L12)

Minimum time in milliseconds for a single execution

***

### p95Ms

> **p95Ms**: `number`

Defined in: [src/workers/metrics/types.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L18)

95th percentile time in milliseconds (p95)

***

### p99Ms

> **p99Ms**: `number`

Defined in: [src/workers/metrics/types.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L20)

99th percentile time in milliseconds (p99)

***

### totalMs

> **totalMs**: `number`

Defined in: [src/workers/metrics/types.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L8)

Total time in milliseconds across all executions
