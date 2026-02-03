import { FastifyOtelInstrumentation } from "@fastify/otel";
import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
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
    console.log("[observability] Tracing is disabled via configuration.");
    return;
  }

  // sampling ratio early Validation
  const ratio = observabilityConfig.samplingRatio;
  if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
    throw new Error(
      `Invalid samplingRatio: ${ratio}. Expected number between 0 and 1.`,
    );
  }
  let exporter: OTLPTraceExporter | ConsoleSpanExporter | undefined;
  let metricExporter: OTLPMetricExporter | undefined;
  let metricReader: PeriodicExportingMetricReader | undefined;

  if (observabilityConfig.exporterEnabled) {
    switch (observabilityConfig.exporterType) {
      case "console":
        exporter = new ConsoleSpanExporter();
        break;

      case "otlp":
        if (
          !observabilityConfig.otlpTraceEndpoint ||
          !observabilityConfig.otlpMetricEndpoint
        ) {
          throw new Error(
            "otlpEndpoint must be provided when exporterType is 'otlp'",
          );
        }
        exporter = new OTLPTraceExporter({
          url: observabilityConfig.otlpTraceEndpoint,
        });

        metricExporter = new OTLPMetricExporter({
          url: observabilityConfig.otlpMetricEndpoint,
        });

        metricReader = new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 60000,
        });

        break;

      default:
        exporter = undefined;
        metricExporter = undefined;
        metricReader = undefined
        break;
    }
  }
  const sampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(ratio),
  });
  try {
    sdk = new NodeSDK({
      traceExporter: exporter,
      textMapPropagator: new W3CTraceContextPropagator(),
      metricReader,
      sampler,
      resource: resourceFromAttributes({
        "service.name": observabilityConfig.serviceName,
      }),
      instrumentations: [
        getNodeAutoInstrumentations(),
        fastifyOtelInstrumentation,
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
