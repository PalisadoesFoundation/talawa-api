import { type Span, trace } from "@opentelemetry/api";
import { observabilityConfig } from "~/src/config/observability";

/**
 * Wraps a database operation with OpenTelemetry tracing.
 * Creates a span for the operation with safe attributes (no SQL or PII).
 *
 * @param model - The model/table name (e.g., "users", "organizations")
 * @param op - The operation type (e.g., "batchLoad", "findById", "insert")
 * @param fn - The async function that performs the database operation
 * @returns The result of the database operation
 *
 * @example
 * ```typescript
 * const users = await traceable("users", "batchLoad", async () => {
 *   return db.select().from(usersTable).where(inArray(usersTable.id, ids));
 * });
 * ```
 */
export async function traceable<T>(
	model: string,
	op: string,
	fn: () => Promise<T>,
): Promise<T> {
	// Return unwrapped function result if tracing is disabled
	if (!observabilityConfig.enabled) {
		return fn();
	}

	const tracer = trace.getTracer("talawa-api");

	return tracer.startActiveSpan(`db:${model}.${op}`, async (span: Span) => {
		// Set safe semantic attributes - no SQL queries or PII
		span.setAttribute("db.system", "postgresql");
		span.setAttribute("db.operation", op);
		span.setAttribute("db.model", model);

		try {
			return await fn();
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
}
