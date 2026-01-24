[**talawa-api**](../../../../README.md)

***

# Interface: OperationMetrics

Defined in: [src/workers/metrics/types.ts:4](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L4)

Metrics for a specific operation type.

## Properties

### avgMs

> **avgMs**: `number`

Defined in: [src/workers/metrics/types.ts:12](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L12)

Average time per execution in milliseconds

***

### count

> **count**: `number`

Defined in: [src/workers/metrics/types.ts:8](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L8)

Total number of executions

***

### maxMaxMs

> **maxMaxMs**: `number`

Defined in: [src/workers/metrics/types.ts:23](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L23)

Maximum of per-snapshot maximum durations in milliseconds.
This represents the largest maximum duration observed across all snapshots.

***

### medianMs

> **medianMs**: `number`

Defined in: [src/workers/metrics/types.ts:25](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L25)

Median execution time in milliseconds (p50)

***

### minMaxMs

> **minMaxMs**: `number`

Defined in: [src/workers/metrics/types.ts:18](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L18)

Minimum of per-snapshot maximum durations in milliseconds.
This represents the smallest maximum duration observed across all snapshots,
not the true minimum operation duration (which requires tracking individual operations).

***

### operation

> **operation**: `string`

Defined in: [src/workers/metrics/types.ts:6](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L6)

Operation name

***

### p95Ms

> **p95Ms**: `number`

Defined in: [src/workers/metrics/types.ts:27](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L27)

95th percentile execution time in milliseconds (p95)

***

### p99Ms

> **p99Ms**: `number`

Defined in: [src/workers/metrics/types.ts:29](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L29)

99th percentile execution time in milliseconds (p99)

***

### totalMs

> **totalMs**: `number`

Defined in: [src/workers/metrics/types.ts:10](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/workers/metrics/types.ts#L10)

Total time in milliseconds
