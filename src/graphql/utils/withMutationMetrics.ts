import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Options for wrapping a GraphQL mutation resolver with performance tracking.
 */
export interface WithMutationMetricsOptions {
	/**
	 * Name of the mutation operation for performance tracking.
	 * Should follow the pattern: `mutation:{mutationName}` (e.g., `mutation:createUser`, `mutation:createOrganization`).
	 */
	operationName: string;
}

/**
 * Wraps a GraphQL mutation resolver with performance tracking instrumentation.
 *
 * This higher-order function provides automatic performance tracking by:
 * 1. Wrapping the resolver execution with `ctx.perf?.time()` if performance tracker is available
 * 2. Gracefully degrading to direct resolver execution if performance tracker is unavailable
 * 3. Ensuring metrics are collected even on mutation errors (via try/finally pattern in perf.time)
 *
 * Scope: This utility only adds resolver-level mutation timing. It does not implement
 * request-scoped wiring, Server-Timing headers, aggregation workers, metrics endpoint,
 * or DataLoader/cache instrumentation; those are documented in the performance-monitoring
 * docs and may be tracked separately.
 *
 * @typeParam TParent - The parent/root type passed to the resolver.
 * @typeParam TArgs - The arguments type for the resolver.
 * @typeParam TContext - The GraphQL context type (must include optional `perf`).
 * @typeParam TResult - The return type of the resolver.
 *
 * @param options - Configuration options for performance tracking.
 * @param resolver - The original resolver function to wrap.
 * @returns A wrapped resolver function with performance tracking behavior.
 *
 * @example
 * ```typescript
 * import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";
 *
 * const resolve = withMutationMetrics(
 *   {
 *     operationName: "mutation:createUser",
 *   },
 *   async (_parent, args, ctx) => {
 *     // Mutation logic here
 *     return result;
 *   },
 * );
 * ```
 */
export function withMutationMetrics<
	TParent,
	TArgs,
	TContext extends { perf?: PerformanceTracker },
	TResult,
>(
	options: WithMutationMetricsOptions,
	resolver: (
		parent: TParent,
		args: TArgs,
		context: TContext,
	) => Promise<TResult>,
): (parent: TParent, args: TArgs, context: TContext) => Promise<TResult> {
	const { operationName } = options;

	// Validate operation name at wrapper creation time (once) instead of runtime (every call)
	if (!operationName || !operationName.trim()) {
		throw new Error("Operation name cannot be empty or whitespace");
	}

	return async (
		parent: TParent,
		args: TArgs,
		context: TContext,
	): Promise<TResult> => {
		// If performance tracker is available, use it to track execution time
		if (context?.perf) {
			return await context.perf.time(operationName, async () => {
				return await resolver(parent, args, context);
			});
		}

		// Graceful degradation: execute resolver directly if perf tracker is unavailable
		return await resolver(parent, args, context);
	};
}
