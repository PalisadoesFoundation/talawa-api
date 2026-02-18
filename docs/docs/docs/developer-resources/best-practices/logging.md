---
id: logging-guide
title: Logging Guide
slug: /developer-resources/logging-guide
sidebar_position: 85
---

This page outlines the structured logging conventions and best practices for the Talawa-API codebase.

## Introduction

Talawa-API uses [Pino](https://github.com/pinojs/pino), a high-performance JSON logger, integrated with Fastify. All logging should follow structured logging conventions to enable consistent log parsing, monitoring, and debugging.

**Key Principles:**
1. Never use `console.*` statements - they are forbidden by linter rules
2. Use structured logging with objects, not string interpolation
3. Include correlation IDs for request tracing
4. Use appropriate log levels

## The Root Logger

The root logger is the base logger instance used across the application. Import it from:

```typescript
import { rootLogger } from "~/src/utilities/logging/logger";
```

The root logger is pre-configured with:
- Service name and environment metadata
- Log level from `LOG_LEVEL` environment variable
- Pretty printing in development mode
- Sensitive field redaction (auth headers, passwords, tokens)

## Structured Logging Format

Always use structured logging with an object as the first argument:

```typescript
// ✅ CORRECT - Structured format
logger.info({ msg: "User created", userId: user.id });
logger.error({ msg: "Failed to fetch data", err: error, endpoint });
logger.warn({ msg: "Rate limit exceeded", key, remaining: 0 });

// ❌ WRONG - String interpolation
logger.info(`User ${userId} created`);  // No structured data
console.log("User created:", userId);     // Forbidden
```

### Standard Fields

| Field | Description | Example |
|-------|-------------|---------|
| `msg` | Human-readable message | `"User created"` |
| `err` | Error object (for errors) | `new Error("Failed")` |
| `userId` | Associated user ID | `"abc123"` |
| `pluginId` | Plugin identifier | `"my-plugin"` |
| `action` | Operation being performed | `"install"`, `"activate"` |

## Log Levels

Use the appropriate log level for each situation:

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Unexpected failures, exceptions | Database connection failed |
| `warn` | Expected issues, degraded behavior | Docker not available, rate limit hit |
| `info` | Significant events | Plugin loaded, server started |
| `debug` | Detailed debugging info | Query parameters, cache hits |

```typescript
// Error - Something went wrong unexpectedly
logger.error({ msg: "Database connection failed", err: error });

// Warn - Something expected but notable
logger.warn({ msg: "Docker not available. Skipping docker step.", pluginId });

// Info - Standard operational events
logger.info({ msg: "Plugin system initialized", successCount: 5, failedCount: 0 });

// Debug - Detailed information for debugging
logger.debug({ msg: "Query executed", sql, params });
```

## Correlation IDs

Every HTTP request is assigned a correlation ID that flows through the entire request lifecycle. This enables tracing logs across services.

### How It Works

1. Fastify assigns a unique ID to each request (from `x-correlation-id` header or auto-generated)
2. The ID is attached to the request logger via `request.log`
3. Pass this logger to downstream functions

```typescript
// In route handlers - use request.log
fastify.get("/api/data", async (request, reply) => {
  request.log.info({ msg: "Processing request" }); // Includes correlationId
});

// In GraphQL context - logger is injected
const resolver = async (_, args, ctx) => {
  ctx.log.info({ msg: "Resolver called", args });
};
```

## Context-Specific Logging

### HTTP Routes

In route handlers, use `request.log` which automatically includes the correlation ID:

```typescript
fastify.post("/api/users", async (request, reply) => {
  request.log.info({ msg: "Creating user" });
  
  try {
    const user = await createUser(request.body);
    request.log.info({ msg: "User created", userId: user.id });
    return { user };
  } catch (error) {
    request.log.error({ msg: "User creation failed", err: error });
    throw error;
  }
});
```

### GraphQL Resolvers

In GraphQL resolvers, use `ctx.log`:

```typescript
export const createPlugin = async (_, args, ctx) => {
  ctx.log.info({ msg: "Installing plugin", pluginId: args.id });
  // ...
};
```

### Plugin System

The plugin context includes a logger. Use optional chaining since the logger might not be available:

```typescript
this.pluginContext.logger.info?.({
  msg: "Plugin activated",
  pluginId,
});

this.pluginContext.logger.error?.({
  msg: "Failed to load plugin",
  pluginId,
  err: error,
});
```

### Background Workers

Inject the logger into background workers:

```typescript
export async function startBackgroundWorker(deps: { logger: Logger }) {
  const { logger } = deps;
  
  logger.info({ msg: "Background worker started" });
  
  // Use the injected logger for all operations
  await processJob(logger);
}
```

### Utilities (Outside Request Context)

For utilities that don't have a request-scoped logger, use `rootLogger`:

```typescript
import { rootLogger } from "~/src/utilities/logging/logger";

export function someUtility() {
  rootLogger.info({ msg: "Utility function called" });
}
```

## What NOT To Do

### Never Use console.*

```typescript
// ❌ FORBIDDEN - Will fail linting
console.log("Debug:", data);
console.error("Error:", error);
console.warn("Warning");

// ✅ Use proper logger
logger.debug({ msg: "Debug", data });
logger.error({ msg: "Error", err: error });
logger.warn({ msg: "Warning" });
```

### Never Use String-Only Logging

```typescript
// ❌ WRONG - No structured data
logger.info("User created successfully");

// ✅ CORRECT - Include relevant context
logger.info({ msg: "User created successfully", userId: user.id });
```

### Never Log Sensitive Data

The logger auto-redacts common sensitive fields, but be mindful:

```typescript
// ❌ WRONG - Logging sensitive data
logger.info({ msg: "Login attempt", password: req.body.password });

// ✅ CORRECT - Omit sensitive fields
logger.info({ msg: "Login attempt", email: req.body.email });
```

## Testing with Mocked Loggers

When testing code that logs, mock the logger:

```typescript
function mockLogger() {
  const base = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockImplementation(() => base),
  };
  return base;
}

it("logs when action occurs", async () => {
  const logger = mockLogger();
  await someFunction({ logger });
  
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      msg: "Action completed",
    })
  );
});
```

## Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Minimum log level (`debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `development` | Pretty printing enabled in development |

## Summary

1. **Import**: Use `rootLogger` or injected loggers
2. **Format**: Always use `{ msg: "...", ...fields }` structure
3. **Levels**: `error` > `warn` > `info` > `debug`
4. **Context**: Include relevant IDs (`userId`, `pluginId`, `correlationId`)
5. **Errors**: Use `{ msg: "...", err: error }` for error objects
6. **Never**: Use `console.*` or log sensitive data
