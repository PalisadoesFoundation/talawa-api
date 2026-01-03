import dotenv from "dotenv";

dotenv.config();
export const observabilityConfig = {
	enabled: process.env.OTEL_ENABLED === "true",
	environment: process.env.OTEL_ENVIRONMENT ?? "local",
	serviceName: process.env.OTEL_SERVICE_NAME ?? "talawa-api",
	samplingRatio: Number(process.env.OTEL_SAMPLING_RATIO ?? "1"),
	otlpEndpoint:
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
		"http://localhost:4318/v1/traces",
};
