import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Options for wrapping a GraphQL query resolver with performance tracking.
 *
 * @typeParam TParent - The parent/root type passed to the resolver.
 * @typeParam TArgs - The arguments type for the resolver.
 * @typeParam TContext - The GraphQL context type (must include optional `perf`).
 * @typeParam TResult - The return type of the resolver.
 */
export interface WithQueryMetricsOptions<
	_TParent,
	_TArgs,
	_TContext extends { perf?: PerformanceTracker },
	_TResult,
> {
	/**
	 * Name of the query operation for performance tracking.
	 * Should follow the pattern: `query:{queryName}` (e.g., `query:user`, `query:organizations`).
	 */
	operationName: string;
}

/**
 * Wraps a GraphQL query resolver with performance tracking instrumentation.
 *
 * This higher-order function provides automatic performance tracking by:
 * 1. Wrapping the resolver execution with `ctx.perf?.time()` if performance tracker is available
 * 2. Gracefully degrading to direct resolver execution if performance tracker is unavailable
 * 3. Ensuring metrics are collected even on query errors (via try/finally pattern in perf.time)
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
 * import { withQueryMetrics } from "~/src/graphql/utils/withQueryMetrics";
 *
 * const resolve = withQueryMetrics(
 *   {
 *     operationName: "query:user",
 *   },
 *   async (_parent, args, ctx) => {
 *     return ctx.drizzleClient.query.usersTable.findFirst({
 *       where: (f, op) => op.eq(f.id, args.input.id),
 *     });
 *   },
 * );
 * ```
 */
export function withQueryMetrics<
	TParent,
	TArgs,
	TContext extends { perf?: PerformanceTracker },
	TResult,
>(
	options: WithQueryMetricsOptions<TParent, TArgs, TContext, TResult>,
	resolver: (
		parent: TParent,
		args: TArgs,
		context: TContext,
	) => Promise<TResult>,
): (parent: TParent, args: TArgs, context: TContext) => Promise<TResult> {
	const { operationName } = options;

	return async (
		parent: TParent,
		args: TArgs,
		context: TContext,
	): Promise<TResult> => {
		// Validate operation name is not empty or whitespace
		if (!operationName || !operationName.trim()) {
			throw new Error("Operation name cannot be empty or whitespace");
		}

		// If performance tracker is available, use it to track execution time
		if (context.perf) {
			return await context.perf.time(operationName, async () => {
				return await resolver(parent, args, context);
			});
		}

		// Graceful degradation: execute resolver directly if perf tracker is unavailable
		return await resolver(parent, args, context);
	};
}
