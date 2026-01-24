[**talawa-api**](../../../../README.md)

***

# Function: wrapBatchWithTracing()

> **wrapBatchWithTracing**\<`K`, `V`\>(`name`, `batchFn`): (`keys`) => `Promise`\<(`V` \| `null`)[]\>

Defined in: [src/utilities/dataloaders/wrapBatchWithTracing.ts:18](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/dataloaders/wrapBatchWithTracing.ts#L18)

Wraps a DataLoader batch function with OpenTelemetry tracing.
Creates a span for each batch execution with the keys count as an attribute.

## Type Parameters

### K

`K`

### V

`V`

## Parameters

### name

`string`

The name of the dataloader (e.g., "users", "organizations")

### batchFn

(`keys`) => `Promise`\<(`V` \| `null`)[]\>

The original batch function that fetches data

## Returns

A wrapped batch function that creates tracing spans

> (`keys`): `Promise`\<(`V` \| `null`)[]\>

### Parameters

#### keys

readonly `K`[]

### Returns

`Promise`\<(`V` \| `null`)[]\>

## Example

```typescript
const tracedBatch = wrapBatchWithTracing("users", batchFn);
return new DataLoader(tracedBatch);
```
