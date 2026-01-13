[API Docs](/)

***

# Interface: OperationMetrics

Defined in: [src/workers/metrics/types.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L18)

Statistics for a specific operation type aggregated across multiple snapshots.

## Remarks

**Important Limitation**: The `minMs` and `maxMs` fields represent the minimum and maximum
of per-snapshot max values (from `PerfSnapshot.ops[operationName].max`), not the actual
minimum and maximum of individual operation durations. This is because `PerfSnapshot` only
stores aggregated statistics per snapshot (count, total ms, and max) rather than individual
operation durations. As a result:
- `minMs` is the minimum value among all per-snapshot max values (an approximation)
- `maxMs` is the maximum value among all per-snapshot max values (an approximation)
- These values may not reflect the true minimum/maximum operation duration if individual
  operations within a snapshot had durations below the snapshot's max value

For more accurate percentile data, see `medianMs`, `p95Ms`, and `p99Ms`, which use a combination
of per-snapshot max values and slow operation durations when available.

## Properties

### avgMs

> **avgMs**: `number`

Defined in: [src/workers/metrics/types.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L24)

Average time in milliseconds per execution

***

### count

> **count**: `number`

Defined in: [src/workers/metrics/types.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L20)

Number of times this operation was executed

***

### maxMs

> **maxMs**: `number`

Defined in: [src/workers/metrics/types.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L43)

Maximum of per-snapshot max values in milliseconds (approximation, not actual max duration).

#### Remarks

This represents the maximum value among all per-snapshot max values from `PerfSnapshot.ops`.
It is an approximation because individual operation durations are not available in `PerfSnapshot`.
The true maximum operation duration may be higher than this value if slow operations are tracked
separately (see `medianMs`, `p95Ms`, `p99Ms` for more accurate percentile data).

***

### medianMs

> **medianMs**: `number`

Defined in: [src/workers/metrics/types.ts:45](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L45)

Median time in milliseconds (p50)

***

### minMs

> **minMs**: `number`

Defined in: [src/workers/metrics/types.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L33)

Minimum of per-snapshot max values in milliseconds (approximation, not actual min duration).

#### Remarks

This represents the minimum value among all per-snapshot max values from `PerfSnapshot.ops`.
It is an approximation because individual operation durations are not available in `PerfSnapshot`.
The true minimum operation duration may be lower than this value.

***

### p95Ms

> **p95Ms**: `number`

Defined in: [src/workers/metrics/types.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L47)

95th percentile time in milliseconds (p95)

***

### p99Ms

> **p99Ms**: `number`

Defined in: [src/workers/metrics/types.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L49)

99th percentile time in milliseconds (p99)

***

### totalMs

> **totalMs**: `number`

Defined in: [src/workers/metrics/types.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/types.ts#L22)

Total time in milliseconds across all executions
