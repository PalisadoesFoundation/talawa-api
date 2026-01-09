/**
 * Proxy wrapper for Drizzle client that automatically tracks database operation performance.
 * Intercepts all query operations and tracks timing using the request-scoped performance tracker.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as drizzleSchema from "~/src/drizzle/schema";
import type { PerformanceTracker } from "./performanceTracker";

/**
 * Type for the Drizzle client with schema.
 */
type DrizzleClient = PostgresJsDatabase<typeof drizzleSchema>;

/**
 * Getter function type for accessing the performance tracker at runtime.
 * This allows the proxy to access request.perf without storing a direct reference.
 */
type PerfGetter = () => PerformanceTracker | undefined;

/**
 * Wraps a Drizzle client with automatic performance tracking.
 * All database operations are automatically timed and tracked.
 *
 * @param client - The original Drizzle client to wrap
 * @param getPerf - Function that returns the current request's performance tracker
 * @returns A proxied Drizzle client with automatic tracking, or the original client if perf is not available
 *
 * @example
 * ```typescript
 * const wrappedClient = wrapDrizzleWithMetrics(
 *   fastify.drizzleClient,
 *   () => request.perf
 * );
 * ```
 */
export function wrapDrizzleWithMetrics(
	client: DrizzleClient,
	getPerf: PerfGetter,
): DrizzleClient {
	const perf = getPerf();

	// If no performance tracker, return original client (zero overhead)
	if (!perf) {
		return client;
	}

	// Create proxy for the client
	return new Proxy(client, {
		get(target, prop, receiver) {
			const original = Reflect.get(target, prop, receiver);

			// Handle query object - recursively wrap table access
			if (prop === "query") {
				return wrapQueryObject(original, getPerf);
			}

			// Handle execute method
			if (prop === "execute") {
				return wrapExecuteMethod(original, getPerf);
			}

			// Handle select, insert, update, delete methods (builder methods)
			// These return query builders, so we wrap them to track when they execute
			if (
				prop === "select" ||
				prop === "insert" ||
				prop === "update" ||
				prop === "delete"
			) {
				return wrapBuilderMethod(original, prop as string, getPerf);
			}

			// For all other properties (like $client, etc.), return as-is
			return original;
		},
	}) as DrizzleClient;
}

/**
 * Wraps the query object to intercept table access and method calls.
 */
function wrapQueryObject(
	query: DrizzleClient["query"],
	getPerf: PerfGetter,
): DrizzleClient["query"] {
	return new Proxy(query, {
		get(target, prop) {
			const table = Reflect.get(target, prop);

			// If accessing a table (e.g., usersTable, organizationsTable)
			if (table && typeof table === "object") {
				return wrapTableMethods(table, prop as string, getPerf);
			}

			return table;
		},
	}) as DrizzleClient["query"];
}

/**
 * Wraps table methods (findFirst, findMany, insert, update, delete, etc.) with timing.
 */
function wrapTableMethods(
	table: Record<string, unknown>,
	tableName: string,
	getPerf: PerfGetter,
): typeof table {
	return new Proxy(table, {
		get(target, prop) {
			const method = Reflect.get(target, prop);

			// If it's a function (findFirst, findMany, insert, update, delete, etc.)
			if (typeof method === "function") {
				return function (this: unknown, ...args: unknown[]) {
					const perf = getPerf();
					if (!perf) {
						// No perf tracker, call original method
						return method.apply(this, args);
					}

					// Create operation name: db:query.usersTable.findFirst
					const operationName = `db:query.${tableName}.${String(prop)}`;

					// Track timing using perf.time()
					return perf.time(operationName, async () => {
						const result = await method.apply(this, args);
						return result;
					});
				};
			}

			return method;
		},
	});
}

/**
 * Wraps the execute method to track raw SQL execution.
 */
function wrapExecuteMethod(
	originalExecute: DrizzleClient["execute"],
	getPerf: PerfGetter,
): DrizzleClient["execute"] {
	return function (this: unknown, ...args: Parameters<typeof originalExecute>) {
		const perf = getPerf();
		if (!perf) {
			return originalExecute.apply(this, args);
		}

		// Track as db:execute
		return perf.time("db:execute", async () => {
			return await originalExecute.apply(this, args);
		});
	} as typeof originalExecute;
}

/**
 * Wraps builder methods (select, insert, update, delete) to track when they execute.
 * These methods return query builders, so we need to wrap the final execution.
 */
function wrapBuilderMethod(
	originalMethod: unknown,
	methodName: string,
	getPerf: PerfGetter,
): unknown {
	return function (this: unknown, ...args: unknown[]) {
		const builder = (originalMethod as (...args: unknown[]) => unknown).apply(
			this,
			args,
		);

		// If the builder has methods that execute (like .then for promises, or specific execute methods)
		// We need to wrap those. However, Drizzle builders are complex, so we'll track at a higher level.
		// For now, we'll return the builder as-is and rely on query object tracking for most operations.
		// The execute() method wrapper will catch raw SQL executions.

		// If builder is a promise-like object, wrap it
		if (builder && typeof builder === "object" && "then" in builder) {
			const perf = getPerf();
			if (!perf) {
				return builder;
			}

			const operationName = `db:${methodName}`;
			return perf.time(operationName, async () => {
				return await builder;
			});
		}

		return builder;
	};
}
