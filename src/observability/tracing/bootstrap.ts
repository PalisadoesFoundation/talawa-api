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

let sdk: NodeSDK | undefined;

export async function initTracing() {
	if (!observabilityConfig.enabled) {
		return;
	}

	const isLocal = observabilityConfig.environment === "local";

	diag.setLogger(
		new DiagConsoleLogger(),
		isLocal ? DiagLogLevel.INFO : DiagLogLevel.ERROR,
	);

	try {
		// Validate sampling ratio early
		const ratio = observabilityConfig.samplingRatio;
		if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
			throw new Error(
				`Invalid samplingRatio: ${ratio}. Expected number between 0 and 1.`,
			);
		}

		const exporter = isLocal
			? new ConsoleSpanExporter()
			: new OTLPTraceExporter({
					url: observabilityConfig.otlpEndpoint,
				});

		const sampler = new ParentBasedSampler({
			root: new TraceIdRatioBasedSampler(ratio),
		});

		sdk = new NodeSDK({
			sampler,
			textMapPropagator: new W3CTraceContextPropagator(),
			traceExporter: exporter,
			resource: resourceFromAttributes({
				"service.name": observabilityConfig.serviceName,
				"deployment.environment": observabilityConfig.environment,
			}),
			instrumentations: [
				new HttpInstrumentation(),
				new FastifyInstrumentation(),
			],
		});

		await sdk.start();

		diag.info("OpenTelemetry tracing initialized successfully");
	} catch (err) {
		console.error(
			"[observability] Failed to initialize OpenTelemetry. Tracing is disabled.",
			err,
		);
		sdk = undefined;
		return;
	}

	const shutdown = async () => {
		if (!sdk) return;
		try {
			await sdk.shutdown();
			diag.info("OpenTelemetry tracing shut down cleanly");
		} catch (err) {
			console.error("[observability] Error during OpenTelemetry shutdown", err);
		}
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}
