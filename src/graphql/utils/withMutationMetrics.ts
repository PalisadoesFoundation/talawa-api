import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Context type containing an optional performance tracker.
 * Used for mutation instrumentation with graceful degradation.
 */
export interface MutationContext {
	perf?: PerformanceTracker;
}

/**
 * Executes a mutation with performance tracking.
 *
 * This utility wraps mutation resolver logic with performance tracking,
 * recording the total execution time under the operation name `mutation:{mutationName}`.
 * If no performance tracker is available, the mutation executes without tracking.
 *
 * @param mutationName - Name of the mutation (e.g., "createUser", "deleteOrganization")
 * @param ctx - GraphQL context containing an optional perf tracker
 * @param fn - Async function containing the mutation logic
 * @returns Promise resolving to the result of the mutation function
 *
 * @example
 * ```typescript
 * // Inside a mutation resolver
 * resolve: async (_parent, args, ctx) => {
 *   return executeMutation("createUser", ctx, async () => {
 *     // ... mutation logic ...
 *     return result;
 *   });
 * }
 * ```
 */
export async function executeMutation<T>(
	mutationName: string,
	ctx: MutationContext,
	fn: () => Promise<T>,
): Promise<T> {
	if (ctx.perf) {
		return ctx.perf.time(`mutation:${mutationName}`, fn);
	}
	return fn();
}
