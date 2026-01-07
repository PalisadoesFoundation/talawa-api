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

## How to Access Performance Monitoring

Performance monitoring is automatically enabled for all HTTP requests. There are three main ways to access performance metrics:

### Server-Timing Headers (Automatic)

Every HTTP response includes a `Server-Timing` header with performance metrics. No configuration needed - it's automatically added to all responses.

**Access via Browser DevTools:**
1. Open your browser's **Developer Tools** (F12 or right-click → Inspect)
2. Navigate to the **Network** tab
3. Make any API request to your Talawa API server
4. Click on the request in the Network tab
5. View the **Timing** or **Headers** section to see the `Server-Timing` header

**Access via Command Line:**
```bash
curl -v http://localhost:4000/graphql
# Look for the "Server-Timing" header in the response
```

### `/metrics/perf` Endpoint (API)

Query the metrics endpoint to retrieve recent performance snapshots programmatically:

```bash
GET http://localhost:4000/metrics/perf
```

**Example Response:**
```json
{
  "recent": [
    {
      "totalMs": 127.5,
      "totalOps": 8,
      "cacheHits": 12,
      "cacheMisses": 3,
      "hitRate": 0.8,
      "ops": {
        "db": { "count": 5, "ms": 45.2, "max": 18.3 }
      },
      "slow": [
        { "op": "db", "ms": 18 }
      ]
    }
  ]
}
```

**Use Cases:**
- Monitoring dashboards
- Alerting systems
- Performance analysis tools
- Custom analytics

### Programmatic Access (In Code)

Access the performance tracker directly in your GraphQL resolvers or route handlers:

**In GraphQL Resolvers:**
```typescript
export const myResolver = async (parent, args, ctx) => {
  // Access the performance tracker
  const perf = ctx.perf;
  
  // Get current snapshot
  const snapshot = perf?.snapshot();
  console.log(`Total operations: ${snapshot?.totalOps}`);
  
  // Track custom operations
  const result = await perf?.time('custom-operation', async () => {
    // Your code here
    return await someAsyncOperation();
  });
  
  return result;
};
```

**In Route Handlers:**
```typescript
app.get('/my-route', async (req, reply) => {
  // Access via request object
  const perf = req.perf;
  const snapshot = perf?.snapshot();
  
  return { metrics: snapshot };
});
```

**Available Methods:**
- `perf.time(name, asyncFn)` - Track async operations
- `perf.start(name)` - Start manual timing (returns stop function)
- `perf.trackDb(ms)` - Track database operation duration
- `perf.trackCacheHit()` - Record cache hit
- `perf.trackCacheMiss()` - Record cache miss
- `perf.trackComplexity(score)` - Track GraphQL query complexity
- `perf.snapshot()` - Get current performance snapshot

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
  const result = await ctx.request.perf?.time('external-api', async () => {
    return await fetch('https://api.example.com/data');
  });
  
  return result;
};
```

### Manual Timing

For non-async operations:

```typescript
const stopTimer = ctx.request.perf?.start('computation');
// ... expensive computation ...
stopTimer?.();
```

## Troubleshooting

### Metrics Not Appearing

1. **Check plugin registration**: Ensure `performance.ts` plugin is loaded in `src/fastifyPlugins/index.ts`
2. **Verify headers**: Use `curl -v` to inspect response headers
3. **Browser compatibility**: Ensure browser supports Server-Timing (Chrome 65+, Firefox 61+)

### Endpoint Returns Empty Array

- Normal on server restart (metrics are in-memory)
- Make some API requests to populate snapshots

### High `totalMs` Values

If `totalMs` is unexpectedly high:
1. Check `ops.db.ms` for slow database queries
2. Review `cacheMiss` count (high misses = more DB hits)
3. Inspect individual operation max times for bottlenecks

## Further Reading

- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [W3C Server Timing Specification](https://w3c.github.io/server-timing/)
- Implementation: `src/fastifyPlugins/performance.ts`
- Tracker utility: `src/utilities/metrics/performanceTracker.ts`
