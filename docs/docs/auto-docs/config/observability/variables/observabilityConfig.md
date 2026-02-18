[API Docs](/)

***

# Variable: observabilityConfig

> `const` **observabilityConfig**: `object`

Defined in: [src/config/observability.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/config/observability.ts#L5)

## Type Declaration

### enabled

> **enabled**: `boolean`

### exporterEnabled

> **exporterEnabled**: `boolean`

### exporterType

> **exporterType**: `string`

### otlpMetricEndpoint

> **otlpMetricEndpoint**: `string` \| `undefined` = `process.env.API_OTEL_METRIC_EXPORTER_ENDPOINT`

### otlpTraceEndpoint

> **otlpTraceEndpoint**: `string` \| `undefined` = `process.env.API_OTEL_TRACE_EXPORTER_ENDPOINT`

### samplingRatio

> **samplingRatio**: `number`

### serviceName

> **serviceName**: `string`
