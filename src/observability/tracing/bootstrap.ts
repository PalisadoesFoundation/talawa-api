import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
	ConsoleSpanExporter,
	ParentBasedSampler,
	TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { observabilityConfig } from "../../config/observability";

export async function initTracing() {
	if (!observabilityConfig.enabled) {
		return;
	}

	const isLocal = observabilityConfig.environment === "local";
	console.log("isLocal", isLocal);

	diag.setLogger(
		new DiagConsoleLogger(),
		isLocal ? DiagLogLevel.INFO : DiagLogLevel.ERROR,
	);

	const exporter = isLocal
		? new ConsoleSpanExporter()
		: new OTLPTraceExporter({ url: observabilityConfig.otlpEndpoint });

	const sampler = new ParentBasedSampler({
		root: new TraceIdRatioBasedSampler(observabilityConfig.samplingRatio),
	});

	const sdk = new NodeSDK({
		sampler,
		textMapPropagator: new W3CTraceContextPropagator(),
		traceExporter: exporter,
		resource: resourceFromAttributes({
			"service.name": observabilityConfig.serviceName,
			"deployment.environment": observabilityConfig.environment,
		}),
		instrumentations: [new HttpInstrumentation(), new FastifyInstrumentation()],
	});

	await sdk.start();

	const shutdown = async () => {
		await sdk.shutdown();
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}
