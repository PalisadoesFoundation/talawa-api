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
