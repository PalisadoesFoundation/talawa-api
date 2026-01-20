[API Docs](/)

***

# Function: shutdownTracing()

> **shutdownTracing**(): `Promise`\<`void`\>

Defined in: src/observability/tracing/bootstrap.ts:80

Shutdown OpenTelemetry tracing gracefully.
This function should be called from the graceful shutdown handler.
Throws an error if shutdown fails or times out.

## Returns

`Promise`\<`void`\>
