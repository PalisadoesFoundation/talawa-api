import { FastifyOtelInstrumentation } from "@fastify/otel";
import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
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

export const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
	registerOnInitialization: false,
});

export async function initTracing(): Promise<void> {
	if (!observabilityConfig.enabled) {
		return;
	}

	const isLocal = observabilityConfig.environment === "local";

	diag.setLogger(
		new DiagConsoleLogger(),
		isLocal ? DiagLogLevel.INFO : DiagLogLevel.ERROR,
	);

	// sampling ratio early Validation
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

	try {
		sdk = new NodeSDK({
			sampler,
			textMapPropagator: new W3CTraceContextPropagator(),
			traceExporter: exporter,
			resource: resourceFromAttributes({
				"service.name": observabilityConfig.serviceName,
				"deployment.environment": observabilityConfig.environment,
			}),
			instrumentations: [new HttpInstrumentation()],
		});

		await sdk.start();

		diag.info("OpenTelemetry tracing initialized successfully");
	} catch (err) {
		console.error(
			"[observability] Failed to initialize OpenTelemetry. Tracing is disabled.",
			err,
		);
		sdk = undefined;
	}
}

/**
 * Shutdown OpenTelemetry tracing gracefully.
 * This function should be called from the graceful shutdown handler.
 * Throws an error if shutdown fails or times out.
 */
export async function shutdownTracing(): Promise<void> {
	if (!sdk) {
		return;
	}

	const timeoutMs = 5000;
	let timeoutId: NodeJS.Timeout | undefined;

	// Create a timeout promise that rejects
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			console.error("[observability] Shutdown timed out");
			reject(new Error("OpenTelemetry shutdown timeout"));
		}, timeoutMs);
	});

	try {
		await Promise.race([sdk.shutdown(), timeoutPromise]);
		console.log("[observability] OpenTelemetry shut down successfully");
	} catch (error) {
		console.error("[observability] Failed to shutdown OpenTelemetry", error);
		throw error;
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}
