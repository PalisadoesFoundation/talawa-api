[API Docs](/)

***

# Function: createPerformanceTracker()

> **createPerformanceTracker**(`opts?`): [`PerformanceTracker`](../interfaces/PerformanceTracker.md)

Defined in: src/utilities/metrics/performanceTracker.ts:118

Creates a performance tracker for request-level metrics.
Tracks operations, cache hits/misses, and provides snapshots.

## Parameters

### opts?

[`PerformanceTrackerOptions`](../interfaces/PerformanceTrackerOptions.md)

Optional configuration for the tracker

## Returns

[`PerformanceTracker`](../interfaces/PerformanceTracker.md)

A new performance tracker instance
