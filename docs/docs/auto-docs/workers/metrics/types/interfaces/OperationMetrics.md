[API Docs](/)

***

# Interface: OperationMetrics

Defined in: [src/workers/metrics/types.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L6)

Metrics for a specific operation type.

## Properties

### avgMs

> **avgMs**: `number`

Defined in: [src/workers/metrics/types.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L14)

Average time per execution in milliseconds

***

### count

> **count**: `number`

Defined in: [src/workers/metrics/types.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L10)

Total number of executions

***

### maxMs

> **maxMs**: `number`

Defined in: [src/workers/metrics/types.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L18)

Maximum execution time in milliseconds

***

### medianMs

> **medianMs**: `number`

Defined in: [src/workers/metrics/types.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L20)

Median execution time in milliseconds (p50)

***

### minMs

> **minMs**: `number`

Defined in: [src/workers/metrics/types.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L16)

Minimum execution time in milliseconds

***

### operation

> **operation**: `string`

Defined in: [src/workers/metrics/types.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L8)

Operation name

***

### p95Ms

> **p95Ms**: `number`

Defined in: [src/workers/metrics/types.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L22)

95th percentile execution time in milliseconds (p95)

***

### p99Ms

> **p99Ms**: `number`

Defined in: [src/workers/metrics/types.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L24)

99th percentile execution time in milliseconds (p99)

***

### totalMs

> **totalMs**: `number`

Defined in: [src/workers/metrics/types.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L12)

Total time in milliseconds
