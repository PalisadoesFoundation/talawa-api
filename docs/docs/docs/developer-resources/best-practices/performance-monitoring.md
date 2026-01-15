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

## Performance Metrics Reference

The following table explains all available performance metrics and their acceptable ranges:

| Metric | Type | Description | Acceptable Range | Notes |
|--------|------|-------------|------------------|-------|
| `totalMs` | number | Total time (milliseconds) spent in all tracked operations during the request | < 500ms (good), < 1000ms (acceptable), > 1000ms (needs investigation) | Includes database queries, cache operations, and custom tracked operations. Does not include network latency or client processing time. |
| `totalOps` | number | Total count of tracked operations (database queries, cache operations, etc.) | Varies by endpoint. Simple queries: 1-5. Complex queries: 5-20. > 50 (may indicate N+1 problem) | Higher counts may indicate inefficient data fetching patterns. Monitor for sudden increases. |
| `cacheHits` | number | Number of successful cache retrievals | Higher is better. Target: > 70% of total cache operations | Reduces database load and improves response times. |
| `cacheMisses` | number | Number of cache lookups that required database queries | Lower is better. Target: < 30% of total cache operations | High miss rates indicate cache warming issues or short TTLs. |
| `hitRate` | number (0-1) | Cache hit rate: `cacheHits / (cacheHits + cacheMisses)` | > 0.7 (good), 0.5-0.7 (acceptable), < 0.5 (needs optimization) | Calculated automatically. A value of 1.0 means all cache operations were hits. |
| `ops[name].count` | number | Number of times a specific operation was called | Varies by operation type | Track individual operation frequency to identify hotspots. |
| `ops[name].ms` | number | Total time (milliseconds) spent in a specific operation | Database: < 100ms per operation. Cache: < 10ms per operation | Sum of all durations for this operation type. Divide by `count` for average. |
| `ops[name].max` | number | Maximum duration (milliseconds) for a single operation call | Database: < 200ms. Cache: < 50ms | Identifies slow outliers that may need optimization. |
| `slow` | Array | List of operations that exceeded the slow threshold (default: 200ms) | Empty array (ideal), < 5 entries (acceptable), > 10 entries (investigate) | Each entry contains `{ op: string, ms: number }`. Maximum 50 entries retained. |
| `complexityScore` | number (optional) | GraphQL query complexity score | < 100 (simple), 100-500 (moderate), 500-1000 (complex), > 1000 (very complex) | Only present for GraphQL requests. Higher scores indicate more expensive queries that may need optimization or rate limiting. |

### Interpreting Metrics

**Good Performance Indicators:**
- `totalMs` < 500ms for most requests
- `hitRate` > 0.7 (70% cache hit rate)
- `slow` array is empty or has < 5 entries
- `ops.db.max` < 200ms (no slow database queries)

**Warning Signs:**
- `totalMs` consistently > 1000ms
- `hitRate` < 0.5 (poor cache efficiency)
- `slow` array frequently has > 10 entries
- `ops.db.max` > 500ms (very slow database queries)
- `totalOps` > 50 (possible N+1 query problem)

**Action Required:**
- `totalMs` > 2000ms (request timeout risk)
- `hitRate` < 0.3 (cache not working effectively)
- `complexityScore` > 1000 (query may be too expensive)
- Multiple operations with `max` > 1000ms

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
      "cacheMisses": 3,
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
| `cacheMisses` | number | Number of cache misses during request |
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

## Metrics Configuration

### Environment Variables

The metrics aggregation system is configurable through the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_METRICS_AGGREGATION_ENABLED` | `true` | Enable or disable the metrics aggregation background worker |
| `API_METRICS_AGGREGATION_CRON_SCHEDULE` | `*/5 * * * *` | Cron schedule for running metrics aggregation (default: every 5 minutes) |
| `API_METRICS_AGGREGATION_WINDOW_MINUTES` | `5` | Time window in minutes for aggregating snapshots |
| `API_METRICS_SNAPSHOT_RETENTION_COUNT` | `1000` | Maximum number of performance snapshots to retain in memory |
| `API_METRICS_API_KEY` | (none) | API key to protect the `/metrics/perf` endpoint. When set, requests require `Authorization: Bearer <key>` header |

### Example Configuration

```bash
# Enable metrics aggregation (default: true)
API_METRICS_AGGREGATION_ENABLED=true

# Run aggregation every 10 minutes
API_METRICS_AGGREGATION_CRON_SCHEDULE="*/10 * * * *"

# Aggregate last 10 minutes of snapshots
API_METRICS_AGGREGATION_WINDOW_MINUTES=10

# Keep last 2000 snapshots in memory
API_METRICS_SNAPSHOT_RETENTION_COUNT=2000

# Protect metrics endpoint with API key (recommended for production)
API_METRICS_API_KEY=your-secure-api-key-here
```

### Accessing Protected Metrics

When `API_METRICS_API_KEY` is set, access the metrics endpoint with:

```bash
curl -H "Authorization: Bearer your-secure-api-key-here" \
  http://localhost:4000/metrics/perf
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
2. Review `cacheMisses` count (high misses = more DB hits)
3. Inspect individual operation max times for bottlenecks

## Further Reading

- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
- [W3C Server Timing Specification](https://w3c.github.io/server-timing/)
- Implementation: `src/fastifyPlugins/performance.ts`
- Tracker utility: `src/utilities/metrics/performanceTracker.ts`

## Observability

This document describes the observability setup for **Talawa API**, focusing on **distributed tracing using OpenTelemetry**.

Talawa API uses OpenTelemetry to provide end-to-end visibility into incoming requests, internal processing, and outgoing calls. This helps with debugging, performance analysis, and production monitoring.

---

### Distributed Tracing

Talawa API uses the **OpenTelemetry Node SDK** with **automatic instrumentation** and **W3C Trace Context propagation**.

### Key Capabilities

- End-to-end request tracing
- Context propagation across services
- Configurable sampling
- Zero-overhead when disabled
- Console-based tracing for local development
- OTLP-based exporting for production

---

### Architecture

- **SDK**: OpenTelemetry Node SDK (`@opentelemetry/sdk-node`)
- **Propagation**: W3C Trace Context (`traceparent` header)
- **Sampling**: Parent-based with ratio sampling
- **Exporters**:
  - Console exporter (local)
  - OTLP HTTP exporter (non-local)
- **Instrumentation**:
  - HTTP (incoming & outgoing requests)
  - Fastify (routes, hooks, handlers)

---

### Configuration

Tracing behavior is controlled through environment variables and centralized in `observabilityConfig`.

### Environment Variables

| Variable                        | Required | Description                 | Values                          |
| ------------------------------- | -------- | --------------------------- | ------------------------------- |
| API_OTEL_ENABLED                | Yes      | Enable or disable tracing   | true, false                     |
| API_OTEL_ENVIRONMENT            | Yes      | Runtime environment         | local, production               |
| API_OTEL_EXPORTER_OTLP_ENDPOINT | No\*     | OTLP HTTP endpoint          | http://localhost:4000/v1/traces |
| API_OTEL_SAMPLING_RATIO         | No       | Trace sampling ratio (0--1) | [0.1, 1]                        |
| API_OTEL_SERVICE_NAME           | No       | Service identifier          | talawa-api                      |

---

### Configuration Source

All observability settings are centralized in:

`config/observability.ts`

```
import dotenv from "dotenv";
dotenv.config();

export const observabilityConfig = {
  enabled: process.env.API_OTEL_ENABLED === "true",
  environment: process.env.API_OTEL_ENVIRONMENT ?? "local",
  serviceName: process.env.API_OTEL_SERVICE_NAME ?? "talawa-api",
  samplingRatio: Number(process.env.API_OTEL_SAMPLING_RATIO ?? "1"),
  otlpEndpoint:
    process.env.API_OTEL_EXPORTER_OTLP_ENDPOINT ??
    "http://localhost:4318/v1/traces",
};
```

---

### Tracing Initialization

Tracing is initialized explicitly via an async bootstrap function:

`initTracing()`

### Key Design Principles

- Tracing is **skipped entirely** if disabled
- SDK initialization happens **once at startup**
- Instrumentation is registered before Fastify is loaded
- Graceful shutdown ensures all spans are flushed

---

### Local Development

In the `local` environment, traces are printed directly to the console using `ConsoleSpanExporter`.

### Example `.env`

```
API_OTEL_ENABLED=true
API_OTEL_ENVIRONMENT=local
API_OTEL_SERVICE_NAME=talawa-api
API_OTEL_SAMPLING_RATIO=1
```

### Start the server and make a request

```
curl http://localhost:4000/graphql
```

### Expected Console Output (Example)

```
{
  "traceId": "347cb51fc1fd41662d768bb1142acff1",
  "id": "fd6b2a8046d8cc77",
  "name": "GET",
  "kind": 1,
  "duration": 19356.5,
  "attributes": {
    "http.method": "GET",
    "http.target": "/graphql",
    "http.status_code": 200
  },
  "status": { "code": 0 }
}
```

> This represents the **root SERVER span** for the incoming HTTP request.

---

### Sampling Behavior

Talawa API uses **parent-based sampling**:

- If a parent span exists → follow the parent's decision
- If the span is a root span → apply `TraceIdRatioBasedSampler`

### Example

```
API_OTEL_SAMPLING_RATIO=0.1
```

- ~10% of new root traces will be sampled
- Child spans automatically inherit the decision

This allows high-volume production systems to reduce telemetry cost without losing trace continuity.

---

### W3C Trace Context Propagation

Talawa API automatically propagates trace context using the standard `traceparent` header.

### Format

```
traceparent: 00-{trace-id}-{parent-id}-{trace-flags}
```

### Example

```
curl -H "traceparent: 00-a1b2c3d4e5f67890abcdef1234567890-1234567890abcdef-01"\
  http://localhost:4000/graphql
```

Behavior:

- Incoming traces are **continued**, not restarted
- Outgoing HTTP calls automatically forward the context

---

### Instrumentation

The following instrumentations are enabled by default:

- **HTTP Instrumentation**
  - Incoming requests
  - Outgoing HTTP calls
- **Fastify Instrumentation**
  - Route handlers
  - Lifecycle hooks
  - Middleware

> Instrumentation is registered during SDK initialization and must occur **before Fastify is imported**.

Additional instrumentations (e.g. database, GraphQL resolvers) can be added later.

---

### Disabling Tracing

Tracing can be completely disabled with zero overhead:

```
API_OTEL_ENABLED=false
```

When disabled:

- SDK is not initialized
- No instrumentation is registered
- No performance impact is introduced
