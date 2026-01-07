import { describe, expect, it, vi } from "vitest";
import { withResolverCache } from "~/src/graphql/utils/withResolverCache";
import type { CacheService } from "~/src/services/caching/CacheService";

/**
 * Creates a mock CacheService for testing.
 */
function createMockCache(
	cacheData: Map<string, unknown> = new Map(),
): CacheService & {
	get: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
} {
	return {
		get: vi.fn().mockImplementation(async (key: string) => {
			return cacheData.get(key) ?? null;
		}),
		set: vi.fn().mockImplementation(async (key: string, value: unknown) => {
			cacheData.set(key, value);
		}),
		del: vi.fn(),
		clearByPattern: vi.fn(),
		mget: vi.fn(),
		mset: vi.fn(),
	} as CacheService & {
		get: ReturnType<typeof vi.fn>;
		set: ReturnType<typeof vi.fn>;
	};
}

describe("withResolverCache", () => {
	describe("cache hit scenarios", () => {
		it("should return cached value without calling resolver on second call", async () => {
			const cacheData = new Map<string, unknown>();
			const cache = createMockCache(cacheData);
			let resolverCalls = 0;

			const resolver = vi.fn().mockImplementation(async () => {
				resolverCalls++;
				return { id: "org-1", name: "Talawa" };
			});

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			// First call: cache miss, resolver called
			const result1 = await wrappedResolver({}, {}, ctx);
			expect(result1).toEqual({ id: "org-1", name: "Talawa" });
			expect(resolverCalls).toBe(1);

			// Second call: cache hit, resolver not called
			const result2 = await wrappedResolver({}, {}, ctx);
			expect(result2).toEqual({ id: "org-1", name: "Talawa" });
			expect(resolverCalls).toBe(1);
		});

		it("should return cached value on first call if already in cache", async () => {
			const cacheData = new Map([
				["talawa:v1:organization:org-1", { id: "org-1", name: "Cached Org" }],
			]);
			const cache = createMockCache(cacheData);

			const resolver = vi.fn();

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);
			expect(result).toEqual({ id: "org-1", name: "Cached Org" });
			expect(resolver).not.toHaveBeenCalled();
		});
	});

	describe("cache miss scenarios", () => {
		it("should call resolver and cache result on cache miss", async () => {
			const cache = createMockCache();

			const resolver = vi
				.fn()
				.mockResolvedValue({ id: "org-1", name: "New Org" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 300,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toEqual({ id: "org-1", name: "New Org" });
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(cache.set).toHaveBeenCalledWith(
				"talawa:v1:organization:org-1",
				{ id: "org-1", name: "New Org" },
				300,
			);
		});
	});

	describe("skip callback", () => {
		it("should bypass cache when skip returns true", async () => {
			const cacheData = new Map([
				["talawa:v1:organization:org-1", { id: "org-1", name: "Cached Org" }],
			]);
			const cache = createMockCache(cacheData);

			const resolver = vi
				.fn()
				.mockResolvedValue({ id: "org-1", name: "Fresh Org" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
					skip: () => true, // Always skip caching
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			// Should return resolver result, not cached value
			expect(result).toEqual({ id: "org-1", name: "Fresh Org" });
			expect(resolver).toHaveBeenCalledTimes(1);
			// Cache should not be read
			expect(cache.get).not.toHaveBeenCalled();
			// Cache should not be written
			expect(cache.set).not.toHaveBeenCalled();
		});

		it("should use cache when skip returns false", async () => {
			const cacheData = new Map([
				["talawa:v1:organization:org-1", { id: "org-1", name: "Cached Org" }],
			]);
			const cache = createMockCache(cacheData);

			const resolver = vi.fn();

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
					skip: () => false, // Don't skip
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toEqual({ id: "org-1", name: "Cached Org" });
			expect(resolver).not.toHaveBeenCalled();
		});

		it("should call skip with correct arguments", async () => {
			const cache = createMockCache();
			const skipFn = vi.fn().mockReturnValue(false);

			const resolver = vi.fn().mockResolvedValue({ id: "1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "key",
					ttlSeconds: 60,
					skip: skipFn,
				},
				resolver,
			);

			const parent = { parentId: "p1" };
			const args = { limit: 100 };
			const ctx = { cache } as { cache: CacheService };

			await wrappedResolver(parent, args, ctx);

			expect(skipFn).toHaveBeenCalledWith(parent, args, ctx);
		});
	});

	describe("null value handling", () => {
		it("should not cache null results from resolver", async () => {
			const cache = createMockCache();

			const resolver = vi.fn().mockResolvedValue(null);

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toBeNull();
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(cache.set).not.toHaveBeenCalled();
		});

		it("should not cache undefined results from resolver", async () => {
			const cache = createMockCache();

			const resolver = vi.fn().mockResolvedValue(undefined);

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toBeUndefined();
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(cache.set).not.toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		it("should propagate resolver errors", async () => {
			const cache = createMockCache();
			const error = new Error("Database connection failed");

			const resolver = vi.fn().mockRejectedValue(error);

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			await expect(wrappedResolver({}, {}, ctx)).rejects.toThrow(
				"Database connection failed",
			);
			expect(cache.set).not.toHaveBeenCalled();
		});

		it("should fall back to resolver when cache.get fails", async () => {
			const cache = createMockCache();
			cache.get.mockRejectedValue(new Error("Redis connection failed"));

			const resolverResult = { id: "org-1", name: "From Resolver" };
			const resolver = vi.fn().mockResolvedValue(resolverResult);

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "key",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			// Should NOT throw, should gracefully fall back to resolver
			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toEqual(resolverResult);
			expect(resolver).toHaveBeenCalledTimes(1);
		});

		it("should return resolver result even if cache.set rejects", async () => {
			const cache = createMockCache();
			cache.set.mockRejectedValue(new Error("Redis write failed"));

			const resolverResult = { id: "org-1", name: "Test Org" };
			const resolver = vi.fn().mockResolvedValue(resolverResult);

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "talawa:v1:organization:org-1",
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			const result = await wrappedResolver({}, {}, ctx);

			expect(result).toEqual(resolverResult);
			expect(cache.set).toHaveBeenCalledWith(
				"talawa:v1:organization:org-1",
				resolverResult,
				60,
			);
		});

		it("should log cache read failures with logger?.debug()", async () => {
			const cache = createMockCache();
			const cacheError = new Error("Redis connection failed");
			cache.get.mockRejectedValue(cacheError);

			const logger = { debug: vi.fn() };
			const resolver = vi.fn().mockResolvedValue({ id: "1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "test-key",
					ttlSeconds: 60,
					logger,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };
			await wrappedResolver({}, {}, ctx);

			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "cache.read.failure",
					cacheKey: "test-key",
					error: cacheError,
				}),
				"Cache read failed, falling back to resolver",
			);
		});

		it("should increment cache.read.failure metric on read error", async () => {
			const cache = createMockCache();
			cache.get.mockRejectedValue(new Error("Redis error"));

			const metrics = { increment: vi.fn() };
			const resolver = vi.fn().mockResolvedValue({ id: "1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "key",
					ttlSeconds: 60,
					metrics,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };
			await wrappedResolver({}, {}, ctx);

			expect(metrics.increment).toHaveBeenCalledWith("cache.read.failure");
		});

		it("should log cache write failures with logger?.debug()", async () => {
			const cache = createMockCache();
			const writeError = new Error("Redis write failed");
			cache.set.mockRejectedValue(writeError);

			const logger = { debug: vi.fn() };
			const resolver = vi.fn().mockResolvedValue({ id: "1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "write-test-key",
					ttlSeconds: 300,
					logger,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };
			await wrappedResolver({}, {}, ctx);

			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "cache.write.failure",
					cacheKey: "write-test-key",
					ttlSeconds: 300,
					error: writeError,
				}),
				"Failed to write to cache",
			);
		});

		it("should increment cache.write.failure metric on write error", async () => {
			const cache = createMockCache();
			cache.set.mockRejectedValue(new Error("Redis write failed"));

			const metrics = { increment: vi.fn() };
			const resolver = vi.fn().mockResolvedValue({ id: "1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: () => "key",
					ttlSeconds: 60,
					metrics,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };
			await wrappedResolver({}, {}, ctx);

			expect(metrics.increment).toHaveBeenCalledWith("cache.write.failure");
		});
	});

	describe("keyFactory", () => {
		it("should use keyFactory result as cache key", async () => {
			const cache = createMockCache();

			const resolver = vi.fn().mockResolvedValue({ id: "org-1" });

			const wrappedResolver = withResolverCache(
				{
					keyFactory: (_p, args: { id: string }) => `custom:prefix:${args.id}`,
					ttlSeconds: 60,
				},
				resolver,
			);

			const ctx = { cache } as { cache: CacheService };

			await wrappedResolver({}, { id: "org-123" }, ctx);

			expect(cache.get).toHaveBeenCalledWith("custom:prefix:org-123");
			expect(cache.set).toHaveBeenCalledWith(
				"custom:prefix:org-123",
				{ id: "org-1" },
				60,
			);
		});

		it("should pass parent, args, and context to keyFactory", async () => {
			const cache = createMockCache();
			const keyFactoryFn = vi.fn().mockReturnValue("key");

			const resolver = vi.fn().mockResolvedValue({});

			const wrappedResolver = withResolverCache(
				{
					keyFactory: keyFactoryFn,
					ttlSeconds: 60,
				},
				resolver,
			);

			const parent = { orgId: "org-1" };
			const args = { limit: 20 };
			const ctx = { cache } as { cache: CacheService };

			await wrappedResolver(parent, args, ctx);

			expect(keyFactoryFn).toHaveBeenCalledWith(parent, args, ctx);
		});
	});
});
