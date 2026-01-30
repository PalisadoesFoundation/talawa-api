import { Type } from "typebox";

export const metricsConfigSchema = Type.Object({
	/**
	 * Sampling ratio for OpenTelemetry traces.
	 * Value between 0 (no traces) and 1 (all traces).
	 * Default: 1 (sample all traces)
	 */
	API_OTEL_SAMPLING_RATIO: Type.Optional(
		Type.Number({
			minimum: 0,
			maximum: 1,
			default: 1,
		}),
	),
	/**
	 * Enabled state for OpenTelemetry tracing.
	 */
	API_OTEL_ENABLED: Type.Boolean({
		default: false,
		description: "Enable or disable OpenTelemetry tracing",
	}),
	/**
	 * Environment name for OpenTelemetry (e.g. 'production', 'development').
	 */
	API_OTEL_ENVIRONMENT: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * OTLP Exporter Endpoint URL.
	 */
	API_OTEL_EXPORTER_OTLP_ENDPOINT: Type.Optional(
		Type.String({
			minLength: 1,
			format: "uri", // Using format: uri for validation
		}),
	),
	/**
	 * Service name for OpenTelemetry.
	 */
	API_OTEL_SERVICE_NAME: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * Cron schedule for the metrics aggregation background worker.
	 * Default: "*\/5 * * * *" (every 5 minutes)
	 */
	API_METRICS_AGGREGATION_CRON_SCHEDULE: Type.Optional(
		Type.String({
			minLength: 9, // Minimum valid cron: "* * * * *"
		}),
	),
	/**
	 * Enable or disable metrics aggregation background worker.
	 * Default: true
	 */
	API_METRICS_AGGREGATION_ENABLED: Type.Optional(
		Type.Boolean({
			default: true,
		}),
	),
	/**
	 * Maximum number of performance snapshots to retain in memory.
	 * Default: 1000
	 */
	API_METRICS_SNAPSHOT_RETENTION_COUNT: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 1000,
		}),
	),
	/**
	 * Time window in minutes for metrics aggregation.
	 * Only snapshots within this window will be included in aggregation.
	 * Default: 5
	 */
	API_METRICS_AGGREGATION_WINDOW_MINUTES: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 5,
		}),
	),
	/**
	 * API key for authenticating requests to the /metrics/perf endpoint.
	 * If not set, the endpoint is unprotected (suitable for development).
	 * In production, set this to a secure random string.
	 */
	API_METRICS_API_KEY: Type.Optional(
		Type.String({
			minLength: 32,
		}),
	),
	/**
	 * Master switch to enable or disable metrics collection and aggregation.
	 * When disabled, metrics collection is skipped entirely.
	 * Default: true
	 */
	API_METRICS_ENABLED: Type.Optional(
		Type.Boolean({
			default: true,
		}),
	),
	/**
	 * Threshold in milliseconds for considering an operation as slow.
	 * Operations exceeding this threshold will be tracked in slow operations metrics.
	 * Default: 200
	 */
	API_METRICS_SLOW_OPERATION_MS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 200,
		}),
	),
	/**
	 * Threshold in milliseconds for considering a request as slow.
	 * This is the single source of truth for slow request detection.
	 * Used for both performance metrics tracking and request logging.
	 * Requests exceeding this threshold will be logged as warnings.
	 * Default: 500
	 */
	API_METRICS_SLOW_REQUEST_MS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 500,
		}),
	),
	/**
	 * Time-to-live in seconds for cached aggregated metrics.
	 * Determines how long metrics remain in cache before expiration.
	 * Default: 300 (5 minutes)
	 */
	API_METRICS_CACHE_TTL_SECONDS: Type.Optional(
		Type.Integer({
			minimum: 1,
			default: 300,
		}),
	),
});
