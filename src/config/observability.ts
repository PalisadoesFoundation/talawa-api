import dotenv from "dotenv";

dotenv.config();

export const observabilityConfig = {
	enabled: process.env.API_OTEL_ENABLED === "true",
	serviceName: process.env.API_OTEL_SERVICE_NAME ?? "talawa-api",
	samplingRatio: Number(process.env.API_OTEL_SAMPLING_RATIO ?? "1"),
	exporterEnabled: process.env.API_OTEL_EXPORTER_ENABLED === "true",
	exporterType: process.env.API_OTEL_EXPORTER_TYPE ?? "otlp",
	otlpTraceEndpoint: process.env.API_OTEL_TRACE_EXPORTER_ENDPOINT,
	otlpMetricEndpoint: process.env.API_OTEL_METRIC_EXPORTER_ENDPOINT
};
