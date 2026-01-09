[API Docs](/)

***

# Type Alias: PerfGetter()

> **PerfGetter** = () => [`PerformanceTracker`](../../performanceTracker/interfaces/PerformanceTracker.md) \| `undefined`

Defined in: [src/utilities/metrics/drizzleProxy.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/drizzleProxy.ts#L13)

Getter function type for accessing the performance tracker at runtime.
This allows the proxy to access request.perf without storing a direct reference.

## Returns

[`PerformanceTracker`](../../performanceTracker/interfaces/PerformanceTracker.md) \| `undefined`
