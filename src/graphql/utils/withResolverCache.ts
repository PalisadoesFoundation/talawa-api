import type { CacheService } from "~/src/services/caching";

/**
 * Options for wrapping a GraphQL resolver with caching.
 *
 * @typeParam TParent - The parent/root type passed to the resolver.
 * @typeParam TArgs - The arguments type for the resolver.
 * @typeParam TContext - The GraphQL context type (must include `cache`).
 * @typeParam TResult - The return type of the resolver.
 */
export interface WithResolverCacheOptions<
	TParent,
	TArgs,
	TContext extends { cache: CacheService },
	_TResult,
> {
	/**
	 * Factory function to generate the cache key from resolver arguments.
	 * Use `entityKey` or `listKey` from `~/src/services/caching` for consistent key generation.
	 *
	 * @param parent - The parent object passed to the resolver.
	 * @param args - The resolver arguments.
	 * @param context - The GraphQL context.
	 * @returns A unique cache key string.
	 */
	keyFactory: (parent: TParent, args: TArgs, context: TContext) => string;

	/**
	 * Time-to-live in seconds for cached values.
	 * Use `getTTL` from `~/src/services/caching` for consistent TTL per entity type.
	 */
	ttlSeconds: number;

	/**
	 * Optional callback to conditionally skip caching.
	 * If this returns `true`, the cache is bypassed and the resolver is called directly.
	 *
	 * @param parent - The parent object passed to the resolver.
	 * @param args - The resolver arguments.
	 * @param context - The GraphQL context.
	 * @returns `true` to skip caching, `false` to use cache.
	 */
	skip?: (parent: TParent, args: TArgs, context: TContext) => boolean;
}

/**
 * Wraps a GraphQL resolver with caching logic.
 *
 * This higher-order function provides resolver-level caching by:
 * 1. Computing a cache key using the provided `keyFactory`
 * 2. Checking the cache for an existing value
 * 3. On cache hit: returning the cached value immediately
 * 4. On cache miss: executing the resolver, caching the result, and returning it
 *
 * @typeParam TParent - The parent/root type passed to the resolver.
 * @typeParam TArgs - The arguments type for the resolver.
 * @typeParam TContext - The GraphQL context type (must include `cache`).
 * @typeParam TResult - The return type of the resolver.
 *
 * @param options - Configuration options for caching.
 * @param resolver - The original resolver function to wrap.
 * @returns A wrapped resolver function with caching behavior.
 *
 * @example
 * ```typescript
 * import { entityKey, getTTL } from "~/src/services/caching";
 * import { withResolverCache } from "~/src/graphql/utils/withResolverCache";
 *
 * const resolve = withResolverCache(
 *   {
 *     keyFactory: (_p, args, _c) => entityKey("organization", args.id),
 *     ttlSeconds: getTTL("organization"),
 *   },
 *   async (_parent, args, ctx) => {
 *     return ctx.drizzleClient.query.organizationsTable.findFirst({
 *       where: (f, op) => op.eq(f.id, args.id),
 *     });
 *   },
 * );
 * ```
 */
export function withResolverCache<
	TParent,
	TArgs,
	TContext extends { cache: CacheService },
	TResult,
>(
	options: WithResolverCacheOptions<TParent, TArgs, TContext, TResult>,
	resolver: (
		parent: TParent,
		args: TArgs,
		context: TContext,
	) => Promise<TResult>,
): (parent: TParent, args: TArgs, context: TContext) => Promise<TResult> {
	const { keyFactory, ttlSeconds, skip } = options;

	return async (
		parent: TParent,
		args: TArgs,
		context: TContext,
	): Promise<TResult> => {
		// Check if caching should be skipped
		if (skip?.(parent, args, context)) {
			return resolver(parent, args, context);
		}

		const cacheKey = keyFactory(parent, args, context);

		// Try to get from cache
		const cached = await context.cache.get<TResult>(cacheKey);
		if (cached !== null) {
			return cached;
		}

		// Cache miss: execute resolver and cache result
		const result = await resolver(parent, args, context);

		// Only cache non-null results
		if (result !== null && result !== undefined) {
			try {
				await context.cache.set(cacheKey, result, ttlSeconds);
			} catch (error) {
				console.error("Failed to write to cache", {
					cacheKey,
					ttlSeconds,
					error,
				});
			}
		}

		return result;
	};
}
