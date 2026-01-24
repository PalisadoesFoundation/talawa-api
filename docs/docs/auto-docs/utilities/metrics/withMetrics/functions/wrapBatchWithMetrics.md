[API Docs](/)

***

# Function: wrapBatchWithMetrics()

> **wrapBatchWithMetrics**\<`K`, `V`\>(`op`, `perf`, `batchFn`): (`keys`) => `Promise`\<(`V` \| `null`)[]\>

Defined in: src/utilities/metrics/withMetrics.ts:18

Wraps a DataLoader batch function with performance tracking.
Tracks the duration of database operations for monitoring.

## Type Parameters

### K

`K`

### V

`V`

## Parameters

### op

`string`

Operation name for tracking (e.g., "users.byId", "organizations.byId")

### perf

[`PerformanceTracker`](../../performanceTracker/interfaces/PerformanceTracker.md)

Performance tracker instance

### batchFn

(`keys`) => `Promise`\<(`V` \| `null`)[]\>

The original batch function that fetches data

## Returns

A wrapped batch function that tracks performance

> (`keys`): `Promise`\<(`V` \| `null`)[]\>

### Parameters

#### keys

readonly `K`[]

### Returns

`Promise`\<(`V` \| `null`)[]\>

## Example

```typescript
const meteredBatch = wrapBatchWithMetrics("users.byId", perf, batchFn);
return new DataLoader(meteredBatch);
```
