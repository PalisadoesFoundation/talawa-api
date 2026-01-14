import { type Span, trace } from "@opentelemetry/api";
import { observabilityConfig } from "~/src/config/observability";

/**
 * Wraps a DataLoader batch function with OpenTelemetry tracing.
 * Creates a span for each batch execution with the keys count as an attribute.
 *
 * @param name - The name of the dataloader (e.g., "users", "organizations")
 * @param batchFn - The original batch function that fetches data
 * @returns A wrapped batch function that creates tracing spans
 *
 * @example
 * ```typescript
 * const tracedBatch = wrapBatchWithTracing("users", batchFn);
 * return new DataLoader(tracedBatch);
 * ```
 */
export function wrapBatchWithTracing<K, V>(
	name: string,
	batchFn: (keys: readonly K[]) => Promise<(V | null)[]>,
): (keys: readonly K[]) => Promise<(V | null)[]> {
	// Return unwrapped function if tracing is disabled
	if (!observabilityConfig.enabled) {
		return batchFn;
	}

	const tracer = trace.getTracer("talawa-api");

	return async (keys: readonly K[]) => {
		return tracer.startActiveSpan(`dataloader:${name}`, async (span: Span) => {
			// Set safe attributes only - no PII, just count
			span.setAttribute("dataloader.name", name);
			span.setAttribute("dataloader.keys.count", keys.length);

			try {
				return await batchFn(keys);
			} catch (error) {
				// Record the error but don't include PII
				span.recordException(
					error instanceof Error ? error : new Error(String(error)),
				);
				throw error;
			} finally {
				span.end();
			}
		});
	};
}
