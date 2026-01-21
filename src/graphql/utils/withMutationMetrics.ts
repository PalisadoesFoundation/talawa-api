import type { GraphQLContext } from "~/src/graphql/context";

/**
 * Wraps a mutation resolver with performance tracking instrumentation.
 * This helper utility provides consistent mutation instrumentation across the codebase
 * and reduces boilerplate when adding performance tracking to mutations.
 *
 * @param mutationName - The name of the mutation (e.g., "createUser", "updateOrganization").
 *   This will be used as the operation name in the format: `mutation:{mutationName}`
 * @param resolver - The mutation resolver function to wrap with performance tracking
 * @param ctx - The GraphQL context containing the optional performance tracker
 * @param args - The resolver arguments
 * @param parent - The parent object (typically unused for mutations)
 * @returns The result of the resolver function
 *
 * @example
 * ```typescript
 * resolve: async (_parent, args, ctx) => {
 *   return withMutationMetrics("createUser", async () => {
 *     // Mutation logic here
 *     return result;
 *   }, ctx, args, _parent);
 * }
 * ```
 *
 * @remarks
 * - If `ctx.perf` is not available, the resolver executes without tracking (graceful degradation)
 * - The operation name follows the pattern: `mutation:{mutationName}`
 * - Metrics are collected even if the mutation fails (errors are propagated)
 * - This helper is optional - some mutations may need custom tracking logic
 */
export async function withMutationMetrics<TArgs, TResult>(
	mutationName: string,
	resolver: () => Promise<TResult>,
	ctx: GraphQLContext,
	_args: TArgs,
	_parent: unknown,
): Promise<TResult> {
	const operationName = `mutation:${mutationName}`;

	return (await ctx.perf?.time(operationName, resolver)) ?? resolver();
}
