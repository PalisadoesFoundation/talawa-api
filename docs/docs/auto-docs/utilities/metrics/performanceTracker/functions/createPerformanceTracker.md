[API Docs](/)

***

# Function: createPerformanceTracker()

> **createPerformanceTracker**(`opts?`): [`PerformanceTracker`](../interfaces/PerformanceTracker.md)

Defined in: [src/utilities/metrics/performanceTracker.ts:112](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L112)

Creates a performance tracker for request-level metrics.
Tracks operations, cache hits/misses, and provides snapshots.

## Parameters

### opts?

[`PerformanceTrackerOptions`](../interfaces/PerformanceTrackerOptions.md)

Optional configuration for the tracker

## Returns

[`PerformanceTracker`](../interfaces/PerformanceTracker.md)

A new performance tracker instance
