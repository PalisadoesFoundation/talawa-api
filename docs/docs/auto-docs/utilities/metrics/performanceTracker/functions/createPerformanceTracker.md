[API Docs](/)

***

# Function: createPerformanceTracker()

> **createPerformanceTracker**(`_slowMs`): [`PerformanceTracker`](../interfaces/PerformanceTracker.md)

Defined in: [src/utilities/metrics/performanceTracker.ts:78](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L78)

Create a new performance tracker for a request.

## Parameters

### \_slowMs

`number` = `200`

Threshold in milliseconds to consider an operation slow (unused in current implementation, reserved for future use)

## Returns

[`PerformanceTracker`](../interfaces/PerformanceTracker.md)

Performance tracker instance
