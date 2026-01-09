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
	// Always return a Proxy that calls getPerf() at call-time
	// This allows metrics to be enabled/disabled dynamically and preserves all client properties
	return new Proxy(client, {
		get(target, prop, receiver) {
			const original = Reflect.get(target, prop, receiver);

			// Handle query object - recursively wrap table access
			if (prop === "query") {
				return wrapQueryObject(original, getPerf);
			}

			// Handle execute method
			if (prop === "execute") {
				return wrapExecuteMethod(original, target, getPerf);
			}

			// Handle select, insert, update, delete methods (builder methods)
			// These return query builders, so we wrap them to track when they execute
			if (
				prop === "select" ||
				prop === "insert" ||
				prop === "update" ||
				prop === "delete"
			) {
				return wrapBuilderMethod(original, target, prop as string, getPerf);
			}

			// For all other properties (like $client, etc.), return as-is
			return original;
		},
		has(target, prop) {
			return Reflect.has(target, prop);
		},
		ownKeys(target) {
			return Reflect.ownKeys(target);
		},
	}) as DrizzleClient;
}

/**
 * Wraps the query object to intercept table access and method calls.
 * Treats any non-null object as a potential table and wraps it.
 * The strict inspection (checking for actual function methods) happens in wrapTableMethods.
 */
function wrapQueryObject(
	query: DrizzleClient["query"],
	getPerf: PerfGetter,
): DrizzleClient["query"] {
	return new Proxy(query, {
		get(target, prop) {
			const table = Reflect.get(target, prop);

			// If it's a non-null object, check if it looks like a Drizzle table.
			// Drizzle tables are objects with methods like findFirst, findMany, etc.
			// We check for function properties to distinguish tables from plain data objects.
			// This preserves reference equality for plain objects while wrapping tables.
			if (
				table &&
				typeof table === "object" &&
				!Array.isArray(table) &&
				typeof table !== "function"
			) {
				// Check if the object has any function properties (indicating it's a table)
				// This is a lightweight check that preserves reference equality for plain objects
				// Use try-catch to handle edge cases where Object.values might fail (e.g., Proxy objects)
				let hasFunctions = false;
				try {
					hasFunctions = Object.values(table).some(
						(value) => typeof value === "function",
					);
				} catch {
					// If Object.values fails (e.g., on Proxy objects), check for common Drizzle table methods
					hasFunctions =
						typeof (table as { findFirst?: unknown }).findFirst ===
							"function" ||
						typeof (table as { findMany?: unknown }).findMany === "function";
				}
				if (hasFunctions) {
					return wrapTableMethods(table, prop as string, getPerf);
				}
				// Plain data objects without functions are returned as-is to preserve reference equality
			}

			// For primitives, arrays, functions, null, and undefined, return as-is
			return table;
		},
	}) as DrizzleClient["query"];
}

/**
 * Wraps table methods (findFirst, findMany, insert, update, delete, etc.) with timing.
 * Only instruments actual function calls - plain objects are returned unchanged.
 * This is where the strict inspection happens to distinguish Drizzle tables from plain objects.
 */
function wrapTableMethods(
	table: Record<string, unknown>,
	tableName: string,
	getPerf: PerfGetter,
): typeof table {
	return new Proxy(table, {
		get(target, prop) {
			const method = Reflect.get(target, prop);

			// Only instrument if it's actually a function (findFirst, findMany, insert, update, delete, etc.)
			// Plain objects will have their properties returned as-is without instrumentation
			if (typeof method === "function") {
				return function (this: unknown, ...args: unknown[]) {
					const perf = getPerf();
					if (!perf) {
						// No perf tracker, call original method on target for correct this binding
						return method.apply(target, args);
					}

					// Create operation name: db:query.usersTable.findFirst
					const operationName = `db:query.${tableName}.${String(prop)}`;

					// Track timing using perf.time()
					// Use target instead of this for correct binding in Drizzle internals
					return perf.time(operationName, async () => {
						const result = await method.apply(target, args);
						return result;
					});
				};
			}

			// For non-function properties (plain objects, primitives, etc.), return as-is
			return method;
		},
	});
}

/**
 * Wraps the execute method to track raw SQL execution.
 */
function wrapExecuteMethod(
	originalExecute: DrizzleClient["execute"],
	target: DrizzleClient,
	getPerf: PerfGetter,
): DrizzleClient["execute"] {
	return function (this: unknown, ...args: Parameters<typeof originalExecute>) {
		const perf = getPerf();
		if (!perf) {
			// Use target instead of this for correct binding in Drizzle internals
			return originalExecute.apply(target, args);
		}

		// Track as db:execute
		// Use target instead of this for correct binding in Drizzle internals
		return perf.time("db:execute", async () => {
			return await originalExecute.apply(target, args);
		});
	} as typeof originalExecute;
}

/**
 * Wraps builder methods (select, insert, update, delete) to track when they execute.
 * These methods return query builders that are both thenable AND chainable.
 * We intercept builder.then() and builder.execute() (if present) to track execution
 * without breaking chainability. Chainable methods (.from, .where, .values, etc.) are
 * forwarded unchanged so chaining still works.
 */
function wrapBuilderMethod(
	originalMethod: unknown,
	target: DrizzleClient,
	methodName: string,
	getPerf: PerfGetter,
): unknown {
	return function (this: unknown, ...args: unknown[]) {
		// Call the original method on target for correct this binding in Drizzle internals
		const builder = (originalMethod as (...args: unknown[]) => unknown).apply(
			target,
			args,
		);

		// If result is not a thenable object, return as-is
		if (
			!builder ||
			typeof builder !== "object" ||
			typeof (builder as { then?: unknown }).then !== "function"
		) {
			return builder;
		}

		// Check if it's a builder (has chainable methods) or just a Promise
		const hasChainableMethods =
			typeof (builder as { from?: unknown }).from === "function" ||
			typeof (builder as { where?: unknown }).where === "function" ||
			typeof (builder as { values?: unknown }).values === "function" ||
			typeof (builder as { set?: unknown }).set === "function";

		// If it's a plain Promise (not a builder), wrap it with perf.time()
		if (!hasChainableMethods) {
			const perf = getPerf();
			if (perf) {
				return perf.time(`db:${methodName}`, async () => {
					return await builder;
				});
			}
			return builder;
		}

		// For builders, wrap .then() and .execute() (if present) to track execution
		// while preserving all chainable methods
		const perf = getPerf();
		if (!perf) {
			return builder;
		}

		// Create a proxy that intercepts .then() and .execute() calls
		return new Proxy(builder, {
			get(target, prop) {
				const original = Reflect.get(target, prop);

				// Wrap .then() to track execution when the builder is awaited
				if (prop === "then") {
					return (
						onFulfilled?: (value: unknown) => unknown,
						onRejected?: (reason: unknown) => unknown,
					) => {
						const originalThen = original as (
							onFulfilled?: (value: unknown) => unknown,
							onRejected?: (reason: unknown) => unknown,
						) => Promise<unknown>;

						// Track timing when the builder is actually executed (via .then())
						return perf.time(`db:${methodName}`, async () => {
							const promise = originalThen.call(
								target,
								onFulfilled,
								onRejected,
							);
							return await promise;
						});
					};
				}

				// Wrap .execute() if present (some builders have explicit execute methods)
				if (prop === "execute" && typeof original === "function") {
					return (...executeArgs: unknown[]) => {
						const originalExecute = original as (
							...args: unknown[]
						) => Promise<unknown>;
						return perf.time(`db:${methodName}`, async () => {
							return await originalExecute.apply(target, executeArgs);
						});
					};
				}

				// Forward all other properties (chainable methods, etc.) unchanged
				return original;
			},
		});
	};
}
