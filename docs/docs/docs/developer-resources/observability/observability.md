---
id: observability
title: Observability
slug: /developer-resources/observability
sidebar_position: 10
---

# Observability

This document describes the observability setup for **Talawa API**, focusing on **distributed tracing using OpenTelemetry**.

Talawa API uses OpenTelemetry to provide end-to-end visibility into incoming requests, internal processing, and outgoing calls. This helps with debugging, performance analysis, and production monitoring.

---

## Distributed Tracing

Talawa API uses the **OpenTelemetry Node SDK** with **automatic instrumentation** and **W3C Trace Context propagation**.

### Key Capabilities

- End-to-end request tracing
- Context propagation across services
- Configurable sampling
- Zero-overhead when disabled
- Console-based tracing for local development
- OTLP-based exporting for production

---

## Architecture

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

## Configuration

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

## Configuration Source

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

## Tracing Initialization

Tracing is initialized explicitly via an async bootstrap function:

`initTracing()`

### Key Design Principles

- Tracing is **skipped entirely** if disabled
- SDK initialization happens **once at startup**
- Instrumentation is registered before Fastify is loaded
- Graceful shutdown ensures all spans are flushed

---

## Local Development

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

## Sampling Behavior

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

## W3C Trace Context Propagation

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

## Instrumentation

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

## Disabling Tracing

Tracing can be completely disabled with zero overhead:

```
API_OTEL_ENABLED=false
```

When disabled:

- SDK is not initialized
- No instrumentation is registered
- No performance impact is introduced
