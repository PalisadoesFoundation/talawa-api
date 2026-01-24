[API Docs](/)

***

# Variable: default()

> **default**: (`app`) => `Promise`\<`void`\>

Defined in: src/fastifyPlugins/errorHandler.ts:33

Fastify error handler plugin for centralized error handling.

This plugin sets up a global error handler that:
- Captures all errors thrown during request processing
- Logs errors with correlation ID for request tracing
- Returns appropriate HTTP status codes (500 for server errors, original status for client errors)
- Masks sensitive error details for 5xx errors
- Includes correlation ID in error responses for client reference

## Parameters

### app

`FastifyInstance`

The Fastify application instance

## Returns

`Promise`\<`void`\>

Resolves when the error handler is registered

## Example

```ts
await app.register(errorHandlerPlugin);
```

## Remarks

- The correlation ID is extracted from the request object (Fastify assigns a unique ID to each request)
- Server errors (5xx) return a generic message to prevent information leakage
- Client errors (4xx) return the original error message
- All errors are logged with full error details for debugging purposes
