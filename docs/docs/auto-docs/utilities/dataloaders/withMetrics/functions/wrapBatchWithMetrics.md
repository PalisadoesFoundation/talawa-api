[API Docs](/)

***

# Function: wrapBatchWithMetrics()

> **wrapBatchWithMetrics**\<`K`, `V`\>(`op`, `perf`, `batchFn`): (`keys`) => `Promise`\<readonly (`V` \| `null`)[]\>

Defined in: [src/utilities/dataloaders/withMetrics.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/withMetrics.ts#L21)

Wraps a DataLoader batch function to track performance metrics.

## Type Parameters

### K

`K`

### V

`V`

## Parameters

### op

`string`

The operation name (e.g., "users.byId", "organizations.byId")

### perf

[`PerformanceTracker`](../../../metrics/performanceTracker/interfaces/PerformanceTracker.md)

The performance tracker instance

### batchFn

(`keys`) => `Promise`\<readonly (`V` \| `null`)[]\>

The original batch function to wrap

## Returns

A wrapped batch function that tracks execution time

> (`keys`): `Promise`\<readonly (`V` \| `null`)[]\>

### Parameters

#### keys

readonly `K`[]

### Returns

`Promise`\<readonly (`V` \| `null`)[]\>

## Example

```typescript
const wrappedBatch = wrapBatchWithMetrics(
  "users.byId",
  ctx.perf,
  async (ids) => { ... }
);
return new DataLoader(wrappedBatch);
```
