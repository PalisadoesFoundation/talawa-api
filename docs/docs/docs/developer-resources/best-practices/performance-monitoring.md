---
id: performance-monitoring
title: Performance Monitoring
slug: /developer-resources/performance-monitoring
sidebar_position: 60
---

# Performance Monitoring and Observability

Talawa API includes built-in performance monitoring to help DevOps teams track request-level performance metrics.

## Quick Reference

Use the table below to quickly find common commands and access points for performance monitoring:

| What You Want | How to Get It |
|---------------|---------------|
| View metrics in browser | Open DevTools → Network tab → Click request → Check `Server-Timing` header |
| View metrics via CLI | `curl -v http://localhost:4000/graphql` → Look for `Server-Timing` header |
| Get recent metrics (API) | `curl http://localhost:4000/metrics/perf` |
| Track custom operation | `await ctx.perf?.time('my-op', async () => { ... })` |
| Instrument a mutation | `withMutationMetrics({ operationName: "mutation:createUser" }, resolver)` |
| Instrument a query | `withQueryMetrics({ operationName: "query:user" }, resolver)` or `executeWithMetrics(ctx, "query:event", fn)` |
| View DataLoader metrics | Check `ops["db:users.byId"]` etc. in snapshot |
| Access aggregated metrics | `fastify.getMetricsSnapshots(windowMinutes?)` |

### Key Thresholds at a Glance

The following thresholds help you quickly identify whether your system performance is healthy, needs attention, or requires immediate action:

| Metric | ✅ Good | ⚠️ Warning | ❌ Critical |
|--------|---------|------------|-------------|
| `totalMs` | < 500ms | 500-1000ms | > 1000ms |
| `hitRate` | > 0.7 | 0.5-0.7 | < 0.5 |
| `totalOps` | < 20 | 20-50 | > 50 |
| `ops.db.max` | < 100ms | 100-200ms | > 200ms |
| `slow` array | Empty | 1-5 entries | > 5 entries |

### Acceptable ranges: rationale

The thresholds above are based on typical API and user-experience goals:

| Parameter | Acceptable range | Why |
|-----------|------------------|-----|
| `totalMs` | < 500ms (good), 500–1000ms (warning), > 1000ms (critical) | Response time strongly affects perceived performance; under 500ms feels responsive, over 1s risks timeouts and poor UX. |
| `hitRate` | > 0.7 (good), 0.5–0.7 (warning), < 0.5 (critical) | High hit rate reduces database load and latency; below 50% means the cache is not effectively offloading the DB. |
| `totalOps` | < 20 (good), 20–50 (warning), > 50 (critical) | Fewer operations mean less overhead and fewer round-trips; > 50 often indicates N+1 patterns and unnecessary work. |
| `ops.db.max` (or per-op `max`) | < 100ms (good), 100–200ms (warning), > 200ms (critical) | Single operations over 200ms are treated as "slow" and usually indicate missing indexes, heavy queries, or external latency. |
| `slow` array length | 0 (good), 1–5 (warning), > 5 (critical) | Each entry is an operation over the slow threshold; many entries mean multiple bottlenecks to fix. |
| `complexityScore` | < 100 (simple), 100–500 (moderate), > 1000 (very complex) | Higher complexity increases CPU and risk of abuse; very high values may need query depth/limit controls. |

### Remediation steps to bring parameters to acceptable ranges

When a parameter is outside the acceptable range, use these steps to bring it back:

| Parameter out of range | Remediation steps |
|------------------------|-------------------|
| **`totalMs`** too high | 1. Identify the main cost: check `ops` and `slow` to see which operation types dominate. 2. If DB: add indexes, use DataLoaders, or optimize queries (see `ops.db.max` and N+1). 3. If cache: improve hit rate (see `hitRate`). 4. If external APIs: add caching, timeouts, or async processing. 5. Re-run the request and compare `totalMs` and `ops` until within target. |
| **`hitRate`** too low | 1. Confirm cache is enabled and keys are stable (no random or per-request-only keys). 2. Review TTL: increase for read-heavy, rarely changing data. 3. Add cache warming for critical paths after deploy or cold start. 4. Avoid over-invalidation: invalidate only when data actually changes. 5. Re-check `cacheHits`, `cacheMisses`, and `hitRate` after changes. |
| **`totalOps`** too high (e.g. N+1) | 1. Use DataLoaders for batched lookups by ID (users, organizations, events, etc.). 2. Replace N single-query resolvers with one batched loader call per entity type. 3. Consider JOINs or denormalization where batching is not enough. 4. Add field-level caching for hot, read-heavy fields. 5. Verify with metrics: `totalOps` and `ops.db.count` should drop. |
| **`ops[name].max`** or **`slow`** entries too high | 1. For DB: run `EXPLAIN ANALYZE` on the slow queries, add indexes on filter/sort columns, and simplify or split very heavy queries. 2. For external APIs: add timeouts, response caching, and circuit breakers. 3. Move non-critical work to background jobs where possible. 4. Re-check `slow` and per-operation `max` after changes. |
| **`complexityScore`** too high | 1. Enforce query depth and breadth limits in the GraphQL schema or middleware. 2. Add pagination (e.g. cursor-based) for list fields. 3. Consider cost/complexity analysis and reject or throttle very expensive queries. 4. Re-test with representative queries and confirm score stays within target. |

After applying remediation, re-check the same request or workload via `/metrics/perf` or Server-Timing to confirm parameters are within the acceptable ranges above.

## Overview

The Performance Metrics Foundation provides:
- **Server-Timing headers** on all HTTP responses for browser-based performance analysis
- **`/metrics/perf` endpoint** returning recent performance snapshots for monitoring dashboards
- **Request-scoped tracking** of database operations, cache hits/misses, and total request duration

## How to Access Performance Monitoring

Performance monitoring is automatically enabled for all HTTP requests. There are three main ways to access performance metrics:

### Server-Timing Headers (Automatic)

Server-Timing headers provide real-time performance breakdown directly in HTTP responses, making them ideal for browser-based debugging and monitoring.

Every HTTP response includes a `Server-Timing` header with performance metrics. No configuration needed.

**Access via Browser DevTools:**
1. Open your browser's **Developer Tools** (F12 or right-click → Inspect)
2. Navigate to the **Network** tab
3. Make any API request to your Talawa API server
4. Click on the request in the Network tab
5. View the **Timing** or **Headers** section to see the `Server-Timing` header

**Access via Command Line:**
```bash
curl -v http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Sample Output:**
```
*   Trying 127.0.0.1:4000...
* Connected to localhost (127.0.0.1) port 4000 (#0)
> POST /graphql HTTP/1.1
> Host: localhost:4000
> Content-Type: application/json
>
< HTTP/1.1 200 OK
< content-type: application/json; charset=utf-8
< Server-Timing: db;dur=45, cache;desc="hit:12|miss:3", total;dur=127
< content-length: 31
<
{"data":{"__typename":"Query"}}
```

**Understanding the Output:**

| Header Component | Example | Meaning | Status |
|------------------|---------|---------|--------|
| `db;dur=45` | 45ms database time | Total time spent in database operations | ✅ Good (< 100ms) |
| `cache;desc="hit:12\|miss:3"` | 12 hits, 3 misses | 80% cache hit rate | ✅ Good (> 70%) |
| `total;dur=127` | 127ms total | End-to-end request processing time | ✅ Good (< 500ms) |

**Server-Timing Header Components:**

| Metric | Description | Example |
|--------|-------------|---------|
| `db;dur=X` | Total database operation time (ms) | `db;dur=45` |
| `cache;desc="hit:X\|miss:Y"` | Cache hit and miss counts | `cache;desc="hit:12\|miss:3"` |
| `total;dur=X` | Total request duration (ms) | `total;dur=127` |

**Sample Browser DevTools View (Chrome):**
```
Timing
──────────────────────────────────────
Queueing:           0.52 ms
Stalled:            1.23 ms
DNS Lookup:         0.00 ms
Initial connection: 0.00 ms
SSL:                0.00 ms
Request sent:       0.15 ms
Waiting (TTFB):     127.45 ms  ← Server processing time
Content Download:   0.89 ms

Server Timing
──────────────────────────────────────
db:     45.00 ms    ← Database operations
cache:  hit:12|miss:3
total:  127.00 ms   ← Total server time
```

**Viewing in Browser DevTools:**

1. Open your browser's **Developer Tools** (F12)
2. Go to the **Network** tab
3. Click on any API request
4. View the **Timing** tab to see the Server-Timing breakdown

Modern browsers (Chrome 65+, Firefox 61+, Edge 79+) automatically visualize these metrics in the Timing tab.

### `/metrics/perf` Endpoint (API)

The `/metrics/perf` endpoint provides a JSON feed of performance data, suitable for integration with monitoring dashboards and alerting systems.

Query the metrics endpoint to retrieve recent performance snapshots programmatically:

```bash
curl http://localhost:4000/metrics/perf | jq '.'
```

**Sample Output (Healthy System):**
```json
{
  "recent": [
    {
      "totalMs": 89,
      "totalOps": 4,
      "cacheHits": 8,
      "cacheMisses": 2,
      "hitRate": 0.8,
      "ops": {
        "db": { "count": 3, "ms": 67.2, "max": 28.5 },
        "validation": { "count": 1, "ms": 12.1, "max": 12.1 }
      },
      "slow": []
    }
  ]
}
```

**Sample Output (System with Performance Issues):**
```json
{
  "recent": [
    {
      "totalMs": 3456,
      "totalOps": 127,
      "cacheHits": 3,
      "cacheMisses": 89,
      "hitRate": 0.03,
      "ops": {
        "db": { "count": 124, "ms": 2890.5, "max": 567.8 },
        "external-api": { "count": 3, "ms": 456.2, "max": 234.1 }
      },
      "slow": [
        { "op": "db", "ms": 568 },
        { "op": "db", "ms": 445 },
        { "op": "db", "ms": 389 }
      ],
      "complexityScore": 1250
    }
  ]
}
```

**Field-by-Field Analysis:**

| Field | Healthy Value | Problematic Value | Issue Detected |
|-------|---------------|-------------------|----------------|
| `totalMs` | 89 | 3456 | ❌ Request taking 3.4 seconds |
| `totalOps` | 4 | 127 | ❌ N+1 query pattern (124 DB calls) |
| `hitRate` | 0.8 (80%) | 0.03 (3%) | ❌ Cache not working |
| `ops.db.max` | 28.5ms | 567.8ms | ❌ Slow database query |
| `slow` | `[]` | 3 entries | ❌ Multiple slow operations |

### Response Schema

The `/metrics/perf` endpoint returns performance data with the following schema:

| Field | Type | Description |
|-------|------|-------------|
| `recent` | Array | Last 50 performance snapshots (limited for memory) |
| `totalMs` | number | Total time spent in tracked operations |
| `cacheHits` | number | Number of cache hits during request |
| `cacheMisses` | number | Number of cache misses during request |
| `ops` | Object | Operation-level statistics |
| `ops[name].count` | number | Number of times operation was called |
| `ops[name].ms` | number | Total milliseconds spent in operation |
| `ops[name].max` | number | Maximum duration for single operation call |

### Retention

Performance metrics are stored in-memory with the following retention policy:

- **In-Memory Storage**: Last 200 snapshots are kept in memory
- **Endpoint Returns**: Maximum 50 most recent snapshots
- **No Persistence**: Metrics reset on server restart

### Programmatic Access (In Code)

Access the performance tracker directly in your GraphQL resolvers or route handlers:

**In GraphQL Resolvers:**
```typescript
export const myResolver = async (parent, args, ctx) => {
  // Access the performance tracker
  const perf = ctx.perf;
  
  // Track a custom operation
  const result = await perf?.time('external-api-call', async () => {
    return await fetch('https://api.example.com/data');
  });
  
  // Get current snapshot for logging
  const snapshot = perf?.snapshot();
  console.log(`Operations so far: ${snapshot?.totalOps}`);
  
  return result;
};
```

**Sample Console Output:**
```
Operations so far: 3
```

**In Route Handlers:**
```typescript
app.get('/health', async (req, reply) => {
  const perf = req.perf;
  const snapshot = perf?.snapshot();
  
  return {
    status: 'healthy',
    metrics: snapshot
  };
});
```

**Sample Response:**
```json
{
  "status": "healthy",
  "metrics": {
    "totalMs": 45,
    "totalOps": 2,
    "cacheHits": 5,
    "cacheMisses": 1,
    "hitRate": 0.83,
    "ops": {
      "db": { "count": 2, "ms": 38.5, "max": 22.1 }
    },
    "slow": []
  }
}
```

**Available Methods:**

| Method | Description | Example |
|--------|-------------|---------|
| `perf.time(name, asyncFn)` | Track async operation duration | `await perf.time('db-query', async () => {...})` |
| `perf.start(name)` | Start manual timing | `const stop = perf.start('compute'); ... stop();` |
| `perf.trackDb(ms)` | Record database operation | `perf.trackDb(45.2)` |
| `perf.trackCacheHit()` | Record cache hit | `perf.trackCacheHit()` |
| `perf.trackCacheMiss()` | Record cache miss | `perf.trackCacheMiss()` |
| `perf.trackComplexity(score)` | Track GraphQL complexity | `perf.trackComplexity(150)` |
| `perf.snapshot()` | Get current metrics | `const metrics = perf.snapshot()` |

### Automatic DataLoader Metrics Tracking

DataLoaders automatically track performance metrics when a performance tracker is provided to `createDataloaders()`. This provides visibility into batch loading operation timing and helps identify N+1 query patterns. **Note:** This is separate from OpenTelemetry tracing (see [Database Operation Tracing](#database-operation-tracing)); metrics tracking focuses on performance timing, while tracing focuses on distributed request flow.

**How It Works:**

When you create DataLoaders with a performance tracker:

```typescript
const dataloaders = createDataloaders(db, cache, ctx.perf);
const user = await dataloaders.user.load(userId);
```

The DataLoader batch function is automatically wrapped with performance metrics tracking. Each batch operation is tracked with the operation name pattern: `db:{loaderName}.byId`. These metrics appear in the performance snapshot (accessible via `/metrics/perf` endpoint or `ctx.perf?.snapshot()`).

**Operation Names:**

| DataLoader | Operation Name |
|------------|----------------|
| User Loader | `db:users.byId` |
| Organization Loader | `db:organizations.byId` |
| Event Loader | `db:events.byId` |
| Action Item Loader | `db:actionItems.byId` |

**Example Snapshot with DataLoader Metrics:**

```json
{
  "totalMs": 156,
  "totalOps": 3,
  "ops": {
    "db:users.byId": { "count": 1, "ms": 45.2, "max": 45.2 },
    "db:organizations.byId": { "count": 1, "ms": 32.1, "max": 32.1 },
    "db:events.byId": { "count": 1, "ms": 28.7, "max": 28.7 }
  }
}
```

**Benefits:**

- Automatic tracking - no manual instrumentation needed
- Identifies N+1 query patterns (high `count` values)
- Detects slow batch operations (high `max` values)
- Works seamlessly with cache metrics (cache hits reduce DB calls)

## Performance Metrics Reference

### Complete Metrics Schema

| Metric | Type | Description | Acceptable Range |
|--------|------|-------------|------------------|
| `totalMs` | number | Total time (ms) in all tracked operations | < 500ms (good), < 1000ms (acceptable), > 1000ms (investigate) |
| `totalOps` | number | Total count of tracked operations | Simple: 1-5, Complex: 5-20, > 50 (N+1 problem) |
| `cacheHits` | number | Successful cache retrievals | Higher is better, target > 70% of total |
| `cacheMisses` | number | Cache lookups requiring database queries | Lower is better, target < 30% of total |
| `hitRate` | number (0-1) | Cache hit rate: `hits / (hits + misses)` | > 0.7 (good), 0.5-0.7 (acceptable), < 0.5 (optimize) |
| `ops[name].count` | number | Times a specific operation was called | Varies by operation type |
| `ops[name].ms` | number | Total time (ms) in a specific operation | DB: < 100ms, Cache: < 10ms |
| `ops[name].max` | number | Maximum duration (ms) for single operation | DB: < 200ms, Cache: < 50ms |
| `slow` | Array | Operations exceeding 200ms threshold | Empty (ideal), < 5 (acceptable), > 10 (investigate) |
| `complexityScore` | number | GraphQL query complexity score | < 100 (simple), 100-500 (moderate), > 1000 (very complex) |

### Interpreting Results

**✅ Good Performance Indicators:**
- `totalMs` < 500ms for most requests
- `hitRate` > 0.7 (70% cache hit rate)
- `slow` array is empty or has < 5 entries
- `ops.db.max` < 200ms (no slow database queries)

**⚠️ Warning Signs:**
- `totalMs` consistently > 1000ms
- `hitRate` < 0.5 (poor cache efficiency)
- `slow` array frequently has > 10 entries
- `ops.db.max` > 500ms (very slow database queries)
- `totalOps` > 50 (possible N+1 query problem)

**❌ Action Required:**
- `totalMs` > 2000ms (request timeout risk)
- `hitRate` < 0.3 (cache not working effectively)
- `complexityScore` > 1000 (query may be too expensive)
- Multiple operations with `max` > 1000ms

## Diagnosing Performance Issues

### High Response Time (`totalMs` > 1000ms)

When response times exceed 1000ms, use the following diagnostic approach to identify the bottleneck:

**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0] | {totalMs, ops, slow}'
```

**Sample Output Indicating Problem:**
```json
{
  "totalMs": 2340,
  "ops": {
    "db": { "count": 15, "ms": 1890.5, "max": 456.2 },
    "external-api": { "count": 3, "ms": 420.1, "max": 180.3 }
  },
  "slow": [
    { "op": "db", "ms": 456 },
    { "op": "db", "ms": 312 }
  ]
}
```

**Analysis:**
- Database operations taking 1890ms (80% of total time)
- 15 database operations suggest potential N+1 issue
- Two slow queries (456ms, 312ms) need optimization

**Recommendations:**
1. **Add database indexes** for frequently queried columns
2. **Implement DataLoader** to batch the 15 database operations
3. **Use `EXPLAIN ANALYZE`** to identify slow query plans
4. **Cache external API responses** to reduce 420ms overhead

### Low Cache Hit Rate (`hitRate` < 0.5)

**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0] | {cacheHits, cacheMisses, hitRate}'
```

**Sample Output Indicating Problem:**
```json
{
  "cacheHits": 2,
  "cacheMisses": 18,
  "hitRate": 0.1
}
```

**Analysis:**
- Only 10% cache hit rate (2 hits vs 18 misses)
- Cache is not being utilized effectively

**Recommendations:**
1. **Review cache keys** - ensure they're consistent and not including request-specific data
2. **Increase TTL** - if data doesn't change frequently, extend cache time-to-live
3. **Implement cache warming** - pre-populate cache for frequently accessed data on startup
4. **Check cache invalidation** - overly aggressive invalidation causes low hit rates

### N+1 Query Pattern (`totalOps` > 50)

**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0] | {totalOps, "db_count": .ops.db.count}'
```

**Sample Output Indicating Problem:**
```json
{
  "totalOps": 87,
  "db_count": 82
}
```

**Analysis:**
- 82 database operations for a single request
- Classic N+1 query pattern (1 query + N related queries)

**Recommendations:**
1. **Implement DataLoader** for batching related queries
2. **Use JOIN queries** to fetch related data in a single query
3. **Review resolver structure** - check if resolvers make individual queries for related data
4. **Add field-level caching** for frequently accessed fields

### Slow Operations in `slow` Array

When operations appear in the `slow` array, they have exceeded the 200ms threshold and require investigation:

**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0].slow'
```

**Sample Output Indicating Problem:**
```json
[
  { "op": "db", "ms": 567 },
  { "op": "db", "ms": 445 },
  { "op": "external-api", "ms": 312 }
]
```

**Analysis:**
- Three operations exceeded the 200ms slow threshold
- Two database queries and one external API call need attention

**Recommendations:**
1. **For slow database queries:**
   - Run `EXPLAIN ANALYZE` to identify missing indexes
   - Add indexes on frequently queried columns
   - Consider query restructuring or denormalization

2. **For slow external API calls:**
   - Implement circuit breakers for resilience
   - Add response caching with appropriate TTL
   - Consider async processing for non-critical calls


## Real-World Scenarios

The following scenarios demonstrate how to use performance metrics to diagnose and resolve common issues in production environments.

### Scenario 1: Optimizing a User List Query

This scenario shows how DataLoader batching can dramatically reduce database load and response times.

**Before Optimization:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0]'
```

```json
{
  "totalMs": 1850,
  "totalOps": 52,
  "cacheHits": 0,
  "cacheMisses": 50,
  "hitRate": 0,
  "ops": {
    "db": { "count": 51, "ms": 1720.5, "max": 89.2 }
  },
  "slow": []
}
```

**Problem:** Fetching 50 users triggers 51 database queries (1 for list + 50 for related data).

**After Implementing DataLoader:**
```json
{
  "totalMs": 156,
  "totalOps": 3,
  "cacheHits": 48,
  "cacheMisses": 2,
  "hitRate": 0.96,
  "ops": {
    "db": { "count": 2, "ms": 89.3, "max": 52.1 }
  },
  "slow": []
}
```

**Improvement:**
- Response time: 1850ms → 156ms (92% faster)
- Database queries: 51 → 2 (96% reduction)
- Cache hit rate: 0% → 96%

### Scenario 2: Identifying a Slow Database Query

This scenario demonstrates how to identify and fix a slow database query using performance metrics and database tooling.

**Metrics showing the problem:**
```json
{
  "totalMs": 892,
  "ops": {
    "db": { "count": 3, "ms": 845.2, "max": 678.5 }
  },
  "slow": [
    { "op": "db", "ms": 679 }
  ]
}
```

**Investigation steps:**
1. One query taking 678ms out of 845ms total DB time
2. Enable query logging to identify the slow query
3. Run `EXPLAIN ANALYZE` on the identified query

**After adding index:**
```json
{
  "totalMs": 124,
  "ops": {
    "db": { "count": 3, "ms": 78.4, "max": 35.2 }
  },
  "slow": []
}
```

**Improvement:**
- Response time: 892ms → 124ms (86% faster)
- Max query time: 678ms → 35ms (95% faster)

### Scenario 3: Cache Warming on Startup

This scenario shows the impact of cache warming on first-request performance after a cold start.

**Before cache warming (cold start):**
```json
{
  "totalMs": 456,
  "cacheHits": 0,
  "cacheMisses": 12,
  "hitRate": 0,
  "ops": {
    "db": { "count": 12, "ms": 398.5, "max": 45.2 }
  }
}
```

**After cache warming:**
```json
{
  "totalMs": 67,
  "cacheHits": 12,
  "cacheMisses": 0,
  "hitRate": 1,
  "ops": {
    "db": { "count": 0, "ms": 0, "max": 0 }
  }
}
```

**Improvement:**
- Response time: 456ms → 67ms (85% faster)
- Database queries: 12 → 0 (100% reduction)
- Cache hit rate: 0% → 100%

## Integration Examples

### Monitoring Dashboard

Poll the `/metrics/perf` endpoint to display real-time performance:

```javascript
// Fetch performance metrics every 5 seconds
async function monitorPerformance() {
  const response = await fetch('http://localhost:4000/metrics/perf');
  const data = await response.json();
  
  if (data.recent.length === 0) {
    console.log('No metrics available yet');
    return;
  }
  
  // Calculate averages
  const avgTotalMs = data.recent.reduce((sum, s) => sum + s.totalMs, 0) / data.recent.length;
  const avgHitRate = data.recent.reduce((sum, s) => sum + s.hitRate, 0) / data.recent.length;
  const avgDbTime = data.recent.reduce((sum, s) => sum + (s.ops.db?.ms || 0), 0) / data.recent.length;
  
  console.log(`
Performance Summary (last ${data.recent.length} requests):
─────────────────────────────────────────────────
Avg Response Time:  ${avgTotalMs.toFixed(2)}ms ${avgTotalMs < 500 ? '✅' : avgTotalMs < 1000 ? '⚠️' : '❌'}
Avg Cache Hit Rate: ${(avgHitRate * 100).toFixed(1)}% ${avgHitRate > 0.7 ? '✅' : avgHitRate > 0.5 ? '⚠️' : '❌'}
Avg DB Time:        ${avgDbTime.toFixed(2)}ms ${avgDbTime < 100 ? '✅' : avgDbTime < 500 ? '⚠️' : '❌'}
  `);
}

setInterval(monitorPerformance, 5000);
```

**Sample Console Output:**
```
Performance Summary (last 50 requests):
─────────────────────────────────────────────────
Avg Response Time:  156.78ms ✅
Avg Cache Hit Rate: 76.3% ✅
Avg DB Time:        89.45ms ✅
```

### Custom Alerting Script

The following Python script monitors performance metrics and sends alerts when thresholds are exceeded:
```python
import requests
import time
from datetime import datetime

THRESHOLDS = {
    'totalMs': 500,
    'hitRate': 0.5,
    'totalOps': 50,
    'dbMax': 200
}

def check_metrics():
    response = requests.get('http://localhost:4000/metrics/perf')
    data = response.json()
    
    alerts = []
    for req in data.get('recent', []):
        if req['totalMs'] > THRESHOLDS['totalMs']:
            alerts.append(f"Slow request: {req['totalMs']}ms (threshold: {THRESHOLDS['totalMs']}ms)")
        
        if req['hitRate'] < THRESHOLDS['hitRate']:
            alerts.append(f"Low cache hit rate: {req['hitRate']*100:.1f}% (threshold: {THRESHOLDS['hitRate']*100}%)")
        
        if req['totalOps'] > THRESHOLDS['totalOps']:
            alerts.append(f"High operation count: {req['totalOps']} (threshold: {THRESHOLDS['totalOps']})")
        
        db_max = req.get('ops', {}).get('db', {}).get('max', 0)
        if db_max > THRESHOLDS['dbMax']:
            alerts.append(f"Slow DB query: {db_max}ms (threshold: {THRESHOLDS['dbMax']}ms)")
    
    if alerts:
        print(f"\n⚠️  ALERTS at {datetime.now().strftime('%H:%M:%S')}:")
        for alert in alerts:
            print(f"   • {alert}")
    else:
        print(f"✅ All metrics healthy at {datetime.now().strftime('%H:%M:%S')}")

while True:
    check_metrics()
    time.sleep(10)
```

**Sample Alert Output:**
```
⚠️  ALERTS at 14:32:15:
   • Slow request: 1234ms (threshold: 500ms)
   • Low cache hit rate: 23.5% (threshold: 50.0%)
   • High operation count: 89 (threshold: 50)

✅ All metrics healthy at 14:32:25

⚠️  ALERTS at 14:32:35:
   • Slow DB query: 456ms (threshold: 200ms)
```

## Metrics Configuration

Customize the metrics system behavior using environment variables to match your deployment needs.
### Environment Variables

The metrics aggregation system is configurable through the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_METRICS_ENABLED` | `true` | Master switch to enable or disable metrics collection and aggregation |
| `API_METRICS_AGGREGATION_ENABLED` | `true` | Enable or disable the metrics aggregation background worker |
| `API_METRICS_AGGREGATION_CRON_SCHEDULE` | `*/5 * * * *` | Cron schedule for running metrics aggregation (default: every 5 minutes) |
| `API_METRICS_AGGREGATION_WINDOW_MINUTES` | `5` | Time window in minutes for aggregating snapshots |
| `API_METRICS_SNAPSHOT_RETENTION_COUNT` | `1000` | Maximum number of performance snapshots to retain in memory |
| `API_METRICS_SLOW_OPERATION_MS` | `200` | Threshold in milliseconds for considering an operation as slow |
| `API_METRICS_SLOW_REQUEST_MS` | `500` | Threshold in milliseconds for considering a request as slow |
| `API_METRICS_CACHE_TTL_SECONDS` | `300` | Time-to-live in seconds for cached aggregated metrics (5 minutes) |
| `API_METRICS_API_KEY` | (none) | API key to protect the `/metrics/perf` endpoint. When set, requests require `Authorization: Bearer <key>` header |

### Example Configuration

```bash
# Enable metrics collection (default: true)
API_METRICS_ENABLED=true

# Enable metrics aggregation (default: true)
API_METRICS_AGGREGATION_ENABLED=true

# Run aggregation every 10 minutes
API_METRICS_AGGREGATION_CRON_SCHEDULE="*/10 * * * *"

# Aggregate last 10 minutes of snapshots
API_METRICS_AGGREGATION_WINDOW_MINUTES=10

# Keep last 2000 snapshots in memory
API_METRICS_SNAPSHOT_RETENTION_COUNT=2000

# Configure slow operation threshold (default: 200ms)
API_METRICS_SLOW_OPERATION_MS=300

# Configure slow request threshold (default: 500ms)
API_METRICS_SLOW_REQUEST_MS=1000

# Configure metrics cache TTL (default: 300 seconds)
API_METRICS_CACHE_TTL_SECONDS=600

# Protect metrics endpoint with API key (recommended for production)
API_METRICS_API_KEY=your-secure-api-key-here
```

### Accessing Protected Metrics

When the `API_METRICS_API_KEY` environment variable is set, all requests to the metrics endpoint require authentication. Use the Authorization header to access protected endpoints:

```bash
curl -H "Authorization: Bearer your-secure-api-key-here" \
  http://localhost:4000/metrics/perf
```

**Sample Output:**
```json
{
  "recent": [
    {
      "totalMs": 89,
      "totalOps": 4,
      "cacheHits": 8,
      "cacheMisses": 2,
      "hitRate": 0.8
    }
  ]
}
```

### Metrics Aggregation Output

The background worker automatically aggregates performance snapshots at the configured interval (default: every 5 minutes) and logs the results to standard output. This log appears in your server console without any command - it runs automatically based on the `API_METRICS_AGGREGATION_CRON_SCHEDULE` setting.

**Example Server Console Log:**

```json
{
  "level": 30,
  "time": 1705234567890,
  "msg": "Metrics aggregation completed successfully",
  "duration": "15ms",
  "windowMinutes": 5,
  "snapshotCount": 120,
  "requestCount": 120,
  "operationCount": 4,
  "slowOperationCount": 2,
  "cacheHitRate": "85.50%"
}
```

> **Note:** This log appears automatically in your server console. To view it, simply monitor your server logs with `pnpm run dev` or check your logging system in production.

**Key Fields:**
- `windowMinutes`: Time window used for aggregation
- `snapshotCount`: Number of snapshots processed
- `requestCount`: Total requests in the window
- `slowOperationCount`: Number of operations potentially needing optimization
- `cacheHitRate`: Global cache efficiency for the period

#### Programmatic Access to Aggregated Metrics

Access aggregated metrics programmatically via the Fastify instance:

```typescript
// Get all recent snapshots
const snapshots = fastify.getMetricsSnapshots();

// Get snapshots from last 10 minutes
const recentSnapshots = fastify.getMetricsSnapshots(10);

// Use in custom endpoints or monitoring
fastify.get("/admin/metrics", async (req, reply) => {
  const snapshots = fastify.getMetricsSnapshots(5); // Last 5 minutes
  return {
    window: "5 minutes",
    count: snapshots.length,
    snapshots: snapshots.slice(0, 20) // Return top 20
  };
});
```

**Use Cases:**

- Custom monitoring dashboards
- Alerting systems
- Performance trend analysis
- Capacity planning

### Metrics Caching

Aggregated metrics can be cached to improve performance when accessing metrics data. The metrics cache service provides:

- **Timestamp-based caching**: Cache metrics by timestamp identifier
- **Time-windowed caching**: Cache hourly and daily aggregations with longer TTLs
- **Configurable TTL**: Control cache expiration via `API_METRICS_CACHE_TTL_SECONDS`

**Cache Key Patterns:**
- Timestamp-based: `talawa:v1:metrics:aggregated:{timestamp}`
- Hourly: `talawa:v1:metrics:aggregated:hourly:{YYYY-MM-DD-HH}`
- Daily: `talawa:v1:metrics:aggregated:daily:{YYYY-MM-DD}`

**Default TTLs:**
- Timestamp-based metrics: 300 seconds (5 minutes)
- Hourly aggregations: 3600 seconds (1 hour)
- Daily aggregations: 86400 seconds (24 hours)

The metrics cache service is automatically initialized when the performance plugin starts and is available via `fastify.metricsCache`. Cache failures are handled gracefully and do not affect metrics collection.

#### Programmatic Access to Cached Metrics

Access cached aggregated metrics via the metrics cache service (`fastify.metricsCache`):

```typescript
// Get by timestamp
const cached = await fastify.metricsCache.getCachedMetrics(timestamp);

// Get by time window (hourly or daily)
const hourly = await fastify.metricsCache.getCachedMetricsByWindow("hourly", "2024-01-15-14");
const daily = await fastify.metricsCache.getCachedMetricsByWindow("daily", "2024-01-15");

// Cache aggregated metrics (metrics object first, then timestamp, then optional TTL)
await fastify.metricsCache.cacheAggregatedMetrics(aggregatedMetrics, timestamp, 600);

// Invalidate: no args = all metrics; pattern = e.g. "aggregated:hourly:*"
await fastify.metricsCache.invalidateMetricsCache();
await fastify.metricsCache.invalidateMetricsCache("aggregated:hourly:*");
```

**Cache Invalidation Strategies:**

- **Time-based**: Let TTL expire naturally (default)
- **Event-based**: Invalidate on significant events (deployments, config changes)
- **Manual**: Invalidate specific time windows when data is known to be stale

## Extending Performance Tracking

You can extend the built-in performance tracking by adding custom operations and manual timing to monitor application-specific code paths.

### Resolver-level instrumentation (withMutationMetrics / withQueryMetrics)

The codebase provides helpers that wrap GraphQL resolvers for consistent operation naming and timing:

- **`withMutationMetrics`** (from `~/src/graphql/utils/withMutationMetrics`) — wraps mutation resolvers with `ctx.perf?.time(operationName, ...)` so each mutation is recorded under a name like `mutation:createUser`. Options: `{ operationName: string }`.
- **`withQueryMetrics`** — analogous for query resolvers (see [Instrumenting GraphQL Queries](#instrumenting-graphql-queries)).

These utilities only add **resolver-level** timing. They do not implement request-scoped wiring, Server-Timing header integration, aggregation workers, the `/metrics/perf` endpoint, or DataLoader/cache instrumentation; those are part of the broader performance foundation and are documented elsewhere in this guide. When linking PRs to issues that cover the full foundation, consider either (a) limiting the issue link to the resolver-level change and adding a checklist of remaining tasks, or (b) implementing the remaining pieces before marking the issue resolved.

#### Mutations: withMutationMetrics and manual patterns

Track performance metrics for GraphQL mutations to identify slow operations.

##### Using the Helper

The `withMutationMetrics` helper takes an **options object** with `operationName` and the resolver:

```typescript
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";

const resolve = withMutationMetrics(
  { operationName: "mutation:createUser" },
  async (_parent, args, ctx) => {
    // Your mutation logic here
    const user = await ctx.drizzleClient.insert(usersTable).values({...});
    return user;
  },
);
```

##### Manual Instrumentation

For more control, instrument mutations manually:

```typescript
export const createEvent = async (parent, args, ctx) => {
  return await ctx.perf?.time("mutation:createEvent", async () => {
    // Main mutation logic
    const event = await createEventInDb(args);

    // Track sub-operations
    await ctx.perf?.time("mutation:createEvent:notification:enqueue", async () => {
      ctx.notification?.enqueueEventCreated({...});
    });

    await ctx.perf?.time("mutation:createEvent:notification:flush", async () => {
      await ctx.notification?.flush(ctx);
    });

    return event;
  });
};
```

##### Operation Naming

Mutations follow the pattern: `mutation:{mutationName}`

| Mutation | Operation Name |
|----------|----------------|
| createUser | `mutation:createUser` |
| createOrganization | `mutation:createOrganization` |
| createEvent | `mutation:createEvent` |
| updateOrganization | `mutation:updateOrganization` |
| deleteOrganization | `mutation:deleteOrganization` |

##### Sub-operation Tracking

For complex mutations with multiple steps, track sub-operations:

```typescript
// Track notification operations separately
"mutation:createEvent:notification:enqueue"
"mutation:createEvent:notification:flush"

// Track validation separately from DB operations
"mutation:updateOrganization:validation"
"mutation:updateOrganization:database"
```

This provides granular visibility into where time is spent within complex mutations.

### Instrumenting GraphQL Queries

Track performance metrics for GraphQL queries to identify slow operations and optimize data fetching.

#### Using the Helper Utility

The `withQueryMetrics` helper takes an **options object** with `operationName` and the resolver:

```typescript
import { withQueryMetrics } from "~/src/graphql/utils/withQueryMetrics";

const resolve = withQueryMetrics(
  { operationName: "query:user" },
  async (_parent, args, ctx) => {
    const user = await ctx.drizzleClient.query.usersTable.findFirst({
      where: (f, op) => op.eq(f.id, args.input.id),
    });
    return user;
  },
);
```

#### Inline Execution: executeWithMetrics

For inline execution (e.g. inside a resolver with branching logic), use `executeWithMetrics`:

```typescript
import { executeWithMetrics } from "~/src/graphql/utils/withQueryMetrics";

// Inside resolver
return await executeWithMetrics(ctx, "query:event", async () => {
  return await fetchEvent(args.id, ctx);
});
```

#### Manual Instrumentation

For more control, instrument queries manually:

```typescript
export const organizations = async (parent, args, ctx) => {
  return await ctx.perf?.time("query:organizations", async () => {
    // Query logic with filtering, pagination
    const orgs = await ctx.drizzleClient.query.organizationsTable.findMany({
      where: (fields, ops) => ops.ilike(fields.name, `%${args.filter}%`),
      limit: args.limit,
      offset: args.offset,
    });
    return orgs;
  });
};
```

#### Operation Naming Convention

Queries follow the naming pattern: `query:{queryName}`

| Query | Operation Name |
|-------|----------------|
| user | `query:user` |
| organization | `query:organization` |
| event | `query:event` |
| organizations | `query:organizations` |

#### Integration with DataLoader Metrics

Query instrumentation works seamlessly with DataLoader metrics. When a query uses DataLoaders, both metrics appear in the snapshot:

```json
{
  "totalMs": 234,
  "ops": {
    "query:organization": { "count": 1, "ms": 234, "max": 234 },
    "db:organizations.byId": { "count": 1, "ms": 45, "max": 45 },
    "db:users.byId": { "count": 1, "ms": 32, "max": 32 }
  }
}
```

This shows:

- Total query time: 234ms
- Organization DataLoader: 45ms
- User DataLoader (for creator): 32ms
- Overhead (validation, etc.): ~157ms

### Custom Operations

Track custom operations in your code to measure specific functionality. For detailed examples of mutation and query instrumentation, see [Resolver-level instrumentation (withMutationMetrics / withQueryMetrics)](#resolver-level-instrumentation-withmutationmetrics--withquerymetrics) and [Instrumenting GraphQL Queries](#instrumenting-graphql-queries).

```typescript
// In a GraphQL resolver
export const myResolver = async (parent, args, ctx) => {
  // Track external API call
  const result = await ctx.request.perf?.time('external-api', async () => {
    return await fetch('https://api.example.com/data');
  });
  
  return result;
};
```

### Manual Timing

For non-async operations, use manual timing. For resolver-level examples using `perf.time()`, see [Mutations: withMutationMetrics and manual patterns](#mutations-withmutationmetrics-and-manual-patterns) and [Instrumenting GraphQL Queries](#instrumenting-graphql-queries).

```typescript
const stopTimer = ctx.request.perf?.start('computation');
// ... expensive computation ...
stopTimer?.();
```

## Production Considerations

Before deploying performance monitoring to production, review the following security, performance, and data retention guidelines.
### Security

> **⚠️ IMPORTANT**: The `/metrics/perf` endpoint supports API key authentication via the `API_METRICS_API_KEY` environment variable. For production deployments:
> - **Set `API_METRICS_API_KEY`** to protect the endpoint (recommended)
> - Use network-level controls (VPN, internal-only access) as additional security
> - If `API_METRICS_API_KEY` is not set, the endpoint is unprotected (suitable for development only)

### Performance Impact

The performance tracking system is designed to have minimal overhead on your application:

| Aspect | Impact | Details |
|--------|--------|---------|
| Memory | ~100KB | ~200 snapshots × ~500 bytes |
| CPU | Negligible | Simple timestamp math |
| I/O | None | All metrics stored in-memory |
| Latency | < 1ms | Minimal overhead per request |

### Data Retention

- **In-Memory Storage**: Last 200 snapshots kept in memory
- **Endpoint Returns**: Maximum 50 most recent snapshots
- **No Persistence**: Metrics reset on server restart
- **No PII**: Metrics contain only timing data, no user information

### Critical validations (mutation instrumentation)

When adding or changing resolver-level mutation instrumentation (e.g. `withMutationMetrics`, `createEvent` notification tracking), complete these validations before merge:

| Validation | Required actions | Addressed in repo |
|------------|------------------|-------------------|
| **1. Transaction boundary (`createEvent`)** | Notification enqueue runs **outside** the database transaction (after commit). If enqueue fails, DB changes are **not** rolled back (fire-and-forget). Accept and document. | Design documented in `createEvent.ts` (comment above notification enqueue block). |
| **2. Performance overhead** | Run load tests measuring per-mutation overhead (target: **&lt;1–2 ms**). Verify no memory leaks; confirm `perf.snapshot()` does not delay responses. | Automated test `test/graphql/utils/withMutationMetrics.overhead.test.ts` asserts average overhead **&lt;2 ms** per mutation. Leak/snapshot checks: run under load if needed. |
| **3. Error stack trace preservation** | Verify `perf.time()` wrapper does not swallow error stack traces; full error context preserved for debugging. | Automated test in `withMutationMetrics.test.ts`: `"should preserve error stack trace when resolver throws"` (same error reference, non-empty `stack`). |

## Troubleshooting

Use the following diagnostic commands and solutions to resolve common performance monitoring issues.
### Metrics Not Appearing

**Diagnostic Command:**
```bash
curl -v http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Expected Output (look for Server-Timing header):**
```
< Server-Timing: db;dur=0, cache;desc="hit:0|miss:0", total;dur=15
```

**If header is missing:**
1. Check plugin registration in `src/fastifyPlugins/index.ts`
2. Verify the performance plugin is loaded
3. Check for errors in server startup logs

### Endpoint Returns Empty Array

An empty `recent` array is normal immediately after server startup since metrics are stored in-memory.
**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent | length'
```

**Sample Output:**
```
0
```

**If output is `0`:**
- Normal after server restart (metrics are in-memory)
- Make some API requests to populate snapshots:

```bash
# Populate metrics with test requests
for i in {1..5}; do
  curl -s http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' > /dev/null
done

# Verify metrics are now available
curl http://localhost:4000/metrics/perf | jq '.recent | length'
```

**Sample Output:**
```
5
```

### High `totalMs` Values

If `totalMs` is unexpectedly high, use the following diagnostic steps:

1. **Check `ops.db.ms`** for slow database queries
2. **Review `cacheMisses` count** - high misses mean more database hits
3. **Inspect individual operation max times** for bottlenecks

**Diagnostic Command:**
```bash
curl http://localhost:4000/metrics/perf | jq '.recent[0] | {totalMs, ops, cacheMisses}'
```

**Sample Output Indicating Issue:**
```json
{
  "totalMs": 2450,
  "ops": {
    "db": { "count": 45, "ms": 2100, "max": 890 }
  },
  "cacheMisses": 42
}
```

This output shows 42 cache misses causing 45 database queries totaling 2100ms - the root cause of the high response time.

### Browser Not Showing Server-Timing

If the Server-Timing header is not visible in your browser's developer tools, verify the following:
**Requirements:**
- Chrome 65+ / Firefox 61+ / Edge 79+
- HTTPS connection (some browsers require secure context)
- No browser extensions blocking headers

**Verification:**
1. Open DevTools → Network tab
2. Click on the request
3. Check "Headers" tab for `Server-Timing`
4. Check "Timing" tab for visual breakdown

---

## Observability with OpenTelemetry

Talawa API uses OpenTelemetry to provide end-to-end visibility into incoming requests, internal processing, and outgoing calls.

### Key Capabilities

- End-to-end request tracing
- Context propagation across services
- Configurable sampling
- Zero-overhead when disabled
- Console-based tracing for local development
- OTLP-based exporting for production/development

### Configuration

Tracing behavior is controlled through environment variables:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `API_OTEL_ENABLED` | Yes | Enable/disable tracing | `false` |
| `API_OTEL_EXPORTER_TYPE` | Yes | Runtime environment (`console` or `otlp`) | `console` |
| `API_OTEL_TRACE_EXPORTER_ENDPOINT` | No | OTLP HTTP endpoint for traces | |
| `API_OTEL_METRIC_EXPORTER_ENDPOINT` | No | OTLP HTTP endpoint for metrics | |
| `API_OTEL_SAMPLING_RATIO` | No | Trace sampling ratio (0-1) | `1` |
| `API_OTEL_SERVICE_NAME` | No | Service identifier | `talawa-api` |
| `API_OTEL_EXPORTER_ENABLED` | Yes | Enable spans exporting | `false` |

**Recommended Settings by Environment:**

| Environment | `ENABLED` | `SAMPLING_RATIO` | Notes |
|-------------|-----------|------------------|-------|
| Local/Dev | `true` | `1` | Capture all traces for debugging |
| Staging | `true` | `0.5` | Balance visibility and overhead |
| Production (low traffic) | `true` | `0.3` | Good visibility |
| Production (high traffic) | `true` | `0.1` | Reduce telemetry cost |

**Sampling Behavior Example:**

```bash
API_OTEL_SAMPLING_RATIO=0.1
```

- ~10% of new root traces will be sampled
- Child spans automatically inherit the parent's sampling decision
- This allows high-volume production systems to reduce telemetry cost without losing trace continuity

### Tracing Modes

Talawa API supports two distinct tracing modes: **Console Mode** for local development and debugging, and **External Mode** for production monitoring with external dashboard services.

#### Console Mode (Local Development)

Console mode outputs spans directly to stdout, ideal for local development and debugging without external dependencies.

**Configuration:**

```bash
API_OTEL_ENABLED=true
API_OTEL_EXPORTER_TYPE=console
API_OTEL_EXPORTER_ENABLED=true
API_OTEL_SAMPLING_RATIO=1
API_OTEL_SERVICE_NAME=talawa-api
```

#### External Mode (Production Monitoring)

External mode exports spans to an external OpenTelemetry-compatible dashboard service using OTLP protocol, enabling centralized monitoring and analysis.

**Configuration:**

```bash
API_OTEL_ENABLED=true
API_OTEL_EXPORTER_TYPE=otlp
API_OTEL_EXPORTER_ENABLED=true
API_OTEL_TRACE_EXPORTER_ENDPOINT=your-service-endpoint
API_OTEL_METRIC_EXPORTER_ENDPOINT=your-service-endpoint
API_OTEL_SAMPLING_RATIO=0.5
API_OTEL_SERVICE_NAME=talawa-api
```
### W3C Trace Context Propagation

Talawa API supports distributed tracing by automatically propagating trace context across service boundaries using the W3C standard format.

Talawa API automatically propagates trace context using the `traceparent` header:

### Disabling Tracing

To completely disable OpenTelemetry tracing with zero runtime overhead, set the following environment variable:

```bash
API_OTEL_ENABLED=false
```

When disabled:

- SDK is not initialized
- No instrumentation is registered
- No performance impact is introduced

**Start the server and make a request:**

**Terminal 1: Start server**
```bash
pnpm run dev
```

**Terminal 2: Make request**
```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Expected Console Output:**
```json
{
  "traceId": "347cb51fc1fd41662d768bb1142acff1",
  "parentId": undefined,
  "id": "fd6b2a8046d8cc77",
  "name": "POST /graphql",
  "kind": 1,
  "timestamp": 1705312456789000,
  "duration": 19356500,
  "attributes": {
    "http.method": "POST",
    "http.url": "http://localhost:4000/graphql",
    "http.target": "/graphql",
    "http.status_code": 200
  },
  "status": { "code": 0 }
}
```

**Understanding the Output:**

| Field | Example | Meaning |
|-------|---------|---------|
| `traceId` | `347cb51...` | Unique identifier for the entire trace |
| `id` | `fd6b2a80...` | Unique identifier for this span |
| `name` | `POST /graphql` | Operation being traced |
| `kind` | `1` | SERVER span (incoming request) |
| `duration` | `19356500` | Duration in nanoseconds (19.36ms) |
| `status.code` | `0` | 0=OK, 1=ERROR |

### W3C Trace Context Propagation

Talawa API supports distributed tracing by automatically propagating trace context across service boundaries using the W3C standard format.

Talawa API automatically propagates trace context using the `traceparent` header:

```bash
curl -H "traceparent: 00-a1b2c3d4e5f67890abcdef1234567890-1234567890abcdef-01" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}' \
     http://localhost:4000/graphql
```

**Expected Behavior:**
- The response will include `{"data":{"__typename":"Query"}}`
- In the server console, the trace will show the provided `traceId` (`a1b2c3d4e5f67890abcdef1234567890`)
- Child spans will inherit this trace context, enabling end-to-end distributed tracing

The trace will continue with the provided `traceId`, enabling distributed tracing across services.

### Disabling Tracing

To completely disable OpenTelemetry tracing with zero runtime overhead, set the following environment variable:

```bash
API_OTEL_ENABLED=false
```

When disabled:

- SDK is not initialized
- No instrumentation is registered
- No performance impact is introduced

---

### Database Operation Tracing

Talawa API instruments database operations using the `traceable` utility, providing visibility into database queries through DataLoaders.

#### Trace Hierarchy

Database operations create child spans under their parent context:

```
HTTP Request → GraphQL Resolver → DataLoader → db:users.batchLoad
```

This enables end-to-end tracing, bottleneck identification, and N+1 query detection.

#### Usage

**Import:**
```typescript
import { traceable } from "~/src/utilities/db/traceableQuery";
```

**Basic Usage:**
```typescript
const users = await traceable("users", "batchLoad", async () => {
  return await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
});
```

**DataLoader Example:**
```typescript
export const createUserLoader = (): DataLoader<string, User | null> => {
  return new DataLoader(async (userIds) => {
    const rows = await traceable("users", "batchLoad", async () => {
      return await db.select().from(usersTable).where(inArray(usersTable.id, [...userIds]));
    });
    const userMap = new Map(rows.map((user) => [user.id, user]));
    return userIds.map((id) => userMap.get(id) ?? null);
  });
};
```

**Span Attributes:**
- `db.system`: `"postgresql"`
- `db.operation`: Operation type (e.g., `"batchLoad"`)
- `db.model`: Table name (e.g., `"users"`)

#### Error Handling

Errors are automatically captured with stack traces and marked with ERROR status. The error is then re-thrown for normal application handling.

#### Sample Output

**Local Console Output:**
```json
{
  "name": "db:users.batchLoad",
  "traceId": "347cb51fc1fd41662d768bb1142acff1",
  "parentId": "a8f3d9e2c1b4a567",
  "duration": 45238.125,
  "attributes": {
    "db.system": "postgresql",
    "db.operation": "batchLoad",
    "db.model": "users"
  },
  "status": { "code": 0 }
}
```

**Production Visualization:**
```
Trace: 347cb51fc1fd41662d768bb1142acff1
├─ POST /graphql (125ms)
   ├─ db:users.batchLoad (45ms)
   ├─ db:organizations.batchLoad (32ms)
   └─ db:events.batchLoad (28ms)
```

#### Best Practices

1. **Use descriptive operation names**: `"findByEmail"` not `"query"`
2. **Wrap only DB operations**: Exclude business logic from traced functions
3. **Match model names to tables**: Use `"users"` for `usersTable`
4. **Primary use case**: DataLoaders batch loading

#### Security

**⚠️ Never include sensitive data in model/operation names**

What is captured:
- ✅ Table names, operation types, timing
- ❌ Query parameters, result data (not captured)

For production, use TLS/HTTPS for OTLP endpoints and consider sampling (`API_OTEL_SAMPLING_RATIO=0.1`).

#### Contributor Guidelines

**When to use `traceable`:**
- ✅ DataLoader batch functions (required)
- ✅ Complex multi-table queries
- ❌ Simple single-row lookups

Verify spans locally: Set `API_OTEL_ENABLED=true` and `API_OTEL_ENVIRONMENT=local`

**Tests:** `test/utilities/db/traceableQuery.test.ts`

#### Further Reading

- Implementation: `src/utilities/db/traceableQuery.ts`
- DataLoader examples: `src/utilities/dataloaders/`
- OpenTelemetry: https://opentelemetry.io/docs/instrumentation/js/

---

## References

- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [W3C Server Timing Specification](https://w3c.github.io/server-timing/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- Implementation: `src/fastifyPlugins/performance.ts`
- Tracker utility: `src/utilities/metrics/performanceTracker.ts`
