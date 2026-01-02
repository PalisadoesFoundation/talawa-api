---
id: performance-monitoring
title: Performance Monitoring
slug: /developer-resources/performance-monitoring
sidebar_position: 60
---

# Performance Monitoring and Observability

Talawa API includes built-in performance monitoring to help DevOps teams track request-level performance metrics.

## Overview

The Performance Metrics Foundation provides:
- **Server-Timing headers** on all HTTP responses for browser-based performance analysis
- **`/metrics/perf` endpoint** returning recent performance snapshots for monitoring dashboards
- **Request-scoped tracking** of database operations, cache hits/misses, and total request duration
- **GraphQL operation tracking** with operation name, type, and complexity scores
- **DataLoader instrumentation** for batch loading performance analysis
- **Cache performance metrics** with hit/miss ratios per request

## Server-Timing Headers

Every API response includes a `Server-Timing` header with performance breakdown:

```
Server-Timing: db;dur=45, cache;desc="hit:12|miss:3", total;dur=127
```

### Header Components

| Metric | Description | Example |
|--------|-------------|---------|
| `db;dur=X` | Total database operation time (ms) | `db;dur=45` |
| `cache;desc="hit:X\|miss:Y"` | Cache hit and miss counts | `cache;desc="hit:12\|miss:3"` |
| `total;dur=X` | Total request duration (ms) | `total;dur=127` |

### Viewing in Browser DevTools

1. Open your browser's **Developer Tools** (F12)
2. Go to the **Network** tab
3. Click on any API request
4. View the **Timing** tab to see the Server-Timing breakdown

![Server Timing Example](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing#browser_compatibility)

Modern browsers (Chrome, Firefox, Edge) automatically visualize these metrics.

## `/metrics/perf` Endpoint

### Accessing Metrics

```bash
GET http://localhost:4000/metrics/perf
```

**Response:**
```json
{
  "recent": [
    {
      "totalMs": 127.5,
      "cacheHits": 12,
      "cacheMiss": 3,
      "ops": {
        "db": { "count": 5, "ms": 45.2, "max": 18.3 },
        "query": { "count": 3, "ms": 32.1, "max": 15.8 }
      }
    }
  ]
}
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `recent` | Array | Last 50 performance snapshots (limited for memory) |
| `totalMs` | number | Total time spent in tracked operations |
| `cacheHits` | number | Number of cache hits during request |
| `cacheMiss` | number | Number of cache misses during request |
| `ops` | Object | Operation-level statistics |
| `ops[name].count` | number | Number of times operation was called |
| `ops[name].ms` | number | Total milliseconds spent in operation |
| `ops[name].max` | number | Maximum duration for single operation call |

### Retention

- **In-Memory Storage**: Last 200 snapshots are kept in memory
- **Endpoint Returns**: Maximum 50 most recent snapshots
- **No Persistence**: Metrics reset on server restart

## GraphQL Performance Tracking

### Automatic Operation Tracking

All GraphQL queries and mutations are automatically tracked with:
- **Operation name**: The name of the GraphQL operation being executed
- **Operation type**: `query`, `mutation`, or `subscription`
- **Complexity score**: Calculated complexity based on query depth and field count
- **Execution time**: Total time to resolve the GraphQL operation

### Slow Operation Logging

Operations taking longer than **500ms** are automatically logged with detailed metrics:

```json
{
  "msg": "Slow GraphQL operation",
  "operation": "getUsersByOrganization",
  "type": "query",
  "complexity": 125,
  "totalMs": 687,
  "dbMs": 453,
  "cacheHits": 15,
  "cacheMisses": 8,
  "hitRate": 0.65
}
```

This helps identify performance bottlenecks in your GraphQL resolvers.

### Cache Hit Rate Analysis

The `hitRate` metric (0.0 to 1.0) indicates cache effectiveness:
- **≥ 0.8**: Excellent cache performance
- **0.5-0.8**: Good cache performance
- **< 0.5**: Consider cache warming or TTL adjustments

## DataLoader Performance

### Automatic Batch Tracking

DataLoader batch operations are instrumented automatically:
- **User lookups**: `dataloader:users` timing
- **Organization lookups**: `dataloader:organizations` timing
- **Event lookups**: `dataloader:events` timing
- **Action item lookups**: `dataloader:actionItems` timing

These metrics appear in the `ops` object of performance snapshots:

```json
{
  "ops": {
    "dataloader:users": {
      "count": 3,
      "ms": 24.5,
      "max": 12.3
    }
  }
}
```

### Optimizing DataLoader Performance

If DataLoader operations are slow:
1. **Check batch sizes**: Large batches may cause memory pressure
2. **Review database indexes**: Ensure proper indexes on lookup keys
3. **Consider caching**: Add Redis caching layer for frequently accessed data

## Cache Performance Tracking

### Request-Scoped Cache Metrics

Every GraphQL request tracks cache operations:
- **Cache hits**: Successful cache retrievals
- **Cache misses**: Cache lookups that required database queries
- **Hit rate**: Ratio of hits to total operations

### Cache Operation Timing

All cache operations are timed:
- `cache:get` - Individual cache retrieval
- `cache:mget` - Batch cache retrieval
- `cache:set` - Cache write operations
- `cache:mset` - Batch cache write operations

Example performance snapshot:

```json
{
  "cacheHits": 12,
  "cacheMisses": 3,
  "ops": {
    "cache:get": { "count": 8, "ms": 15.2, "max": 3.4 },
    "cache:mget": { "count": 2, "ms": 8.7, "max": 5.1 }
  }
}
```

## Integration Examples

### Monitoring Dashboard

Poll the `/metrics/perf` endpoint to display real-time performance:

```javascript
// Fetch performance metrics every 5 seconds
setInterval(async () => {
  const response = await fetch('http://localhost:4000/metrics/perf');
  const data = await response.json();
  
  // Display average database time
  const avgDbTime = data.recent
    .map(s => s.ops.db?.ms || 0)
    .reduce((a, b) => a + b, 0) / data.recent.length;
  
  console.log(`Avg DB time: ${avgDbTime.toFixed(2)}ms`);
}, 5000);
```

### APM Tool Integration

Many Application Performance Monitoring (APM) tools automatically capture `Server-Timing` headers:

- **New Relic**: Automatically captures custom timing metrics
- **Datadog**: RUM integration reads Server-Timing headers
- **Elastic APM**: Correlates server-side timing with user experience

### Custom Alerting

Monitor for slow requests using the `/metrics/perf` endpoint:

```python
import requests
import time

THRESHOLD_MS = 500  # Alert on requests > 500ms

while True:
    response = requests.get('http://localhost:4000/metrics/perf')
    data = response.json()
    
    slow_requests = [s for s in data['recent'] if s['totalMs'] > THRESHOLD_MS]
    
    if slow_requests:
        print(f"⚠️  {len(slow_requests)} slow requests detected!")
        for req in slow_requests:
            print(f"  - Total: {req['totalMs']}ms, DB: {req['ops'].get('db', {}).get('ms', 0)}ms")
    
    time.sleep(10)
```

## Production Considerations

### Security

> **⚠️ WARNING**: The `/metrics/perf` endpoint currently has no authentication. For production deployments:
> - Add API key authentication, or
> - Restrict access to admin users only, or  
> - Use network-level controls (VPN, internal-only access)

### Performance Impact

The performance tracking system is designed to be lightweight:
- **Memory overhead**: ~200 snapshots × ~500 bytes = ~100KB
- **CPU overhead**: Negligible (simple timestamp math)
- **No I/O**: All metrics stored in-memory, no database writes

### Privacy

Performance metrics **do not contain PII** (Personally Identifiable Information):
- ✅ Operation counts and timings
- ✅ Cache statistics
- ❌ User IDs, emails, or other personal data
- ❌ Request/response payloads

## Extending Performance Tracking

### Custom Operations

Track custom operations in your code:

```typescript
// In a GraphQL resolver
export const myResolver = async (parent, args, ctx) => {
  // Track external API call
  const result = await ctx.perf?.time('external-api', async () => {
    return await fetch('https://api.example.com/data');
  });
  
  return result;
};
```

### Manual Timing

For non-async operations:

```typescript
const stopTimer = ctx.perf?.start('computation');
// ... expensive computation ...
stopTimer?.();
```

### Tracking Cache Operations

Manual cache tracking (automatically handled by `metricsCacheProxy`):

```typescript
// Cache hit
ctx.perf?.trackCacheHit();

// Cache miss
ctx.perf?.trackCacheMiss();
```

### DataLoader Instrumentation

When creating custom DataLoaders, use the `wrapBatchWithMetrics` wrapper:

```typescript
import { wrapBatchWithMetrics } from "~/src/utilities/dataloaders/withMetrics";

4. Look for slow DataLoader operations in the `ops` object
5. Check GraphQL complexity scores for overly complex queries

### Low Cache Hit Rate

If cache hit rate is consistently below 50%:
1. Verify cache service is properly configured
2. Check cache TTL settings in `src/services/caching/cacheConfig.ts`
3. Review cache invalidation patterns
4. Consider implementing cache warming for frequently accessed data
export const createMyLoader = (db: DatabaseConnection, perf?: PerformanceTracker) => {
  return new DataLoader(
    wrapBatchWithMetrics("dataloader:myEntity", perf, async (ids: readonly string[]) => {
      // Your batch loading logic
      return await db.select().from(myTable).where(inArray(myTable.id, ids));
    })
  );
};
```

## Troubleshooting

### Metrics Not Appearing

1. **Check plugin registration**: Ensure `performance.ts` plugin is loaded in `src/fastifyPlugins/index.ts`
2. **Verify headers**: Use `curl -v` to inspect response headers
3. **Browser compatibility**: Ensure browser supports Server-Timing (Chrome 65+, Firefox 61+)

### Endpoint Returns Empty Array

- NImplementation Details

### Key Files

- **Performance Plugin**: `src/fastifyPlugins/performance.ts` - Fastify plugin with GraphQL operation tracking
- **Performance Tracker**: `src/utilities/metrics/performanceTracker.ts` - Core tracking utility
- **DataLoader Wrapper**: `src/utilities/dataloaders/withMetrics.ts` - DataLoader instrumentation
- **Cache Proxy**: `src/services/caching/metricsCacheProxy.ts` - Request-scoped cache tracking
- **GraphQL Route**: `src/routes/graphql.ts` - GraphQL operation hooks and context integration

### Test Coverage

Comprehensive test coverage available:
- `test/utilities/dataloaders/withMetrics.test.ts` - DataLoader wrapper tests
- `test/services/caching/metricsCacheProxy.test.ts` - Cache proxy tests
- `test/fastifyPlugins/performance.test.ts` - Performance plugin tests
- `test/routes/graphql.performance.test.ts` - GraphQL integration tests

## Further Reading

- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [W3C Server Timing Specification](https://w3c.github.io/server-timing/)
- [DataLoader Documentation](https://github.com/graphql/dataloader)
- [GraphQL Complexity Analysis](https://www.npmjs.com/package/@pothos/plugin-complexity)
1. Check `ops.db.ms` for slow database queries
2. Review `cacheMiss` count (high misses = more DB hits)
3. Inspect individual operation max times for bottlenecks

## Further Reading

- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [W3C Server Timing Specification](https://w3c.github.io/server-timing/)
- Implementation: `src/fastifyPlugins/performance.ts`
- Tracker utility: `src/utilities/metrics/performanceTracker.ts`
