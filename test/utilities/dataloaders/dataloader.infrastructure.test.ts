import { describe, expect, it, vi } from "vitest";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import { type CacheService, entityKey } from "~/src/services/caching";
import { createDataloaders } from "~/src/utilities/dataloaders";
import { createActionItemLoader } from "~/src/utilities/dataloaders/actionItemLoader";
import { createEventLoader } from "~/src/utilities/dataloaders/eventLoader";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";
import { createUserLoader } from "~/src/utilities/dataloaders/userLoader";

/**
 * Creates a mock DrizzleClient for testing DataLoaders.
 * Returns both the mock db and a spy for the where function.
 */
function createMockDb<T>(mockResults: T[]) {
	const whereSpy = vi.fn().mockResolvedValue(mockResults);
	const db = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: whereSpy,
	} as unknown as DrizzleClient;
	return { db, whereSpy };
}

/**
 * Creates a mock CacheService for testing cache integration.
 */
function createMockCache(cachedValues: Map<string, unknown> = new Map()) {
	return {
		get: vi.fn().mockResolvedValue(null),
		set: vi.fn().mockResolvedValue(undefined),
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
		mget: vi.fn().mockImplementation((keys: string[]) => {
			return Promise.resolve(keys.map((k) => cachedValues.get(k) ?? null));
		}),
		mset: vi.fn().mockResolvedValue(undefined),
	} as unknown as CacheService;
}

describe("DataLoader infrastructure", () => {
	describe("createUserLoader", () => {
		it("returns results in the same order as keys and batches calls", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "u2", name: "B" },
				{ id: "u1", name: "A" },
			]);

			const loader = createUserLoader(db, null);

			// Trigger multiple loads in the same tick to ensure batching
			const p1 = loader.load("u1");
			const p2 = loader.load("u2");
			const p3 = loader.load("u3");

			const results = await Promise.all([p1, p2, p3]);

			// Verify order preservation: results match input key order
			expect(results).toEqual([
				{ id: "u1", name: "A" },
				{ id: "u2", name: "B" },
				null, // u3 not found
			]);

			// Verify batching: db.where should be called once
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("returns null for non-existent IDs", async () => {
			const { db } = createMockDb([]);

			const loader = createUserLoader(db, null);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "A" }]);

			const loader = createUserLoader(db, null);

			// Load the same key twice
			const result1 = await loader.load("u1");
			const result2 = await loader.load("u1");

			// Both should return the same cached result
			expect(result1).toEqual({ id: "u1", name: "A" });
			expect(result2).toEqual({ id: "u1", name: "A" });

			// Should only hit the database once due to caching
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("createOrganizationLoader", () => {
		it("returns results in the same order as keys and batches calls", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "org2", name: "Org B" },
				{ id: "org1", name: "Org A" },
			]);

			const loader = createOrganizationLoader(db, null);

			const p1 = loader.load("org1");
			const p2 = loader.load("org2");
			const p3 = loader.load("org3");

			const results = await Promise.all([p1, p2, p3]);

			expect(results).toEqual([
				{ id: "org1", name: "Org A" },
				{ id: "org2", name: "Org B" },
				null, // org3 not found
			]);

			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("returns null for non-existent IDs", async () => {
			const { db } = createMockDb([]);

			const loader = createOrganizationLoader(db, null);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);

			const loader = createOrganizationLoader(db, null);

			// Load the same key twice
			const result1 = await loader.load("org1");
			const result2 = await loader.load("org1");

			// Both should return the same cached result
			expect(result1).toEqual({ id: "org1", name: "Org A" });
			expect(result2).toEqual({ id: "org1", name: "Org A" });

			// Should only hit the database once due to caching
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("createEventLoader", () => {
		it("returns results in the same order as keys and batches calls", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "evt2", name: "Event B" },
				{ id: "evt1", name: "Event A" },
			]);

			const loader = createEventLoader(db, null);

			const p1 = loader.load("evt1");
			const p2 = loader.load("evt2");
			const p3 = loader.load("evt3");

			const results = await Promise.all([p1, p2, p3]);

			expect(results).toEqual([
				{ id: "evt1", name: "Event A" },
				{ id: "evt2", name: "Event B" },
				null, // evt3 not found
			]);

			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("returns null for non-existent IDs", async () => {
			const { db } = createMockDb([]);

			const loader = createEventLoader(db, null);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "evt1", name: "Event A" }]);

			const loader = createEventLoader(db, null);

			// Load the same key twice
			const result1 = await loader.load("evt1");
			const result2 = await loader.load("evt1");

			// Both should return the same cached result
			expect(result1).toEqual({ id: "evt1", name: "Event A" });
			expect(result2).toEqual({ id: "evt1", name: "Event A" });

			// Should only hit the database once due to caching
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("createActionItemLoader", () => {
		it("returns results in the same order as keys and batches calls", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "ai2", organizationId: "org1" },
				{ id: "ai1", organizationId: "org1" },
			]);

			const loader = createActionItemLoader(db, null);

			const p1 = loader.load("ai1");
			const p2 = loader.load("ai2");
			const p3 = loader.load("ai3");

			const results = await Promise.all([p1, p2, p3]);

			expect(results).toEqual([
				{ id: "ai1", organizationId: "org1" },
				{ id: "ai2", organizationId: "org1" },
				null, // ai3 not found
			]);

			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("returns null for non-existent IDs", async () => {
			const { db } = createMockDb([]);

			const loader = createActionItemLoader(db, null);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "ai1", organizationId: "org1" },
			]);

			const loader = createActionItemLoader(db, null);

			// Load the same key twice
			const result1 = await loader.load("ai1");
			const result2 = await loader.load("ai1");

			// Both should return the same cached result
			expect(result1).toEqual({ id: "ai1", organizationId: "org1" });
			expect(result2).toEqual({ id: "ai1", organizationId: "org1" });

			// Should only hit the database once due to caching
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("createDataloaders", () => {
		it("creates all loaders from a single db instance", () => {
			const { db } = createMockDb([]);

			const loaders = createDataloaders(db, null);

			expect(loaders).toHaveProperty("user");
			expect(loaders).toHaveProperty("organization");
			expect(loaders).toHaveProperty("event");
			expect(loaders).toHaveProperty("actionItem");
		});

		it("creates independent loader instances on each call", () => {
			const { db } = createMockDb([]);

			const loaders1 = createDataloaders(db, null);
			const loaders2 = createDataloaders(db, null);

			// Each call should create new loader instances (request-scoped)
			expect(loaders1.user).not.toBe(loaders2.user);
			expect(loaders1.organization).not.toBe(loaders2.organization);
			expect(loaders1.event).not.toBe(loaders2.event);
			expect(loaders1.actionItem).not.toBe(loaders2.actionItem);
		});
	});

	describe("cache integration", () => {
		describe("createOrganizationLoader cache", () => {
			it("uses wrapWithCache when cache is provided", async () => {
				const mockCache = createMockCache();
				const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);

				const loader = createOrganizationLoader(db, mockCache);
				await loader.load("org1");

				// Verify cache was checked (mget is called by wrapWithCache)
				expect(mockCache.mget).toHaveBeenCalled();
				// Verify result was cached (mset is called for cache misses)
				expect(mockCache.mset).toHaveBeenCalled();
				// Verify DB was hit since cache returned null
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database when cache is null", async () => {
				const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);

				const loader = createOrganizationLoader(db, null);
				await loader.load("org1");

				// Verify DB was hit directly
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("returns cached value on cache hit and skips database", async () => {
				const cachedOrg = { id: "org1", name: "Cached Org" };
				const cachedValues = new Map([
					[entityKey("organization", "org1"), cachedOrg],
				]);
				const mockCache = createMockCache(cachedValues);
				const { db, whereSpy } = createMockDb([]);

				const loader = createOrganizationLoader(db, mockCache);
				const result = await loader.load("org1");

				// Verify cached value returned
				expect(result).toEqual(cachedOrg);
				// Verify DB was NOT hit (cache hit)
				expect(whereSpy).not.toHaveBeenCalled();
			});

			it("stores fetched values in cache on cache miss", async () => {
				const mockCache = createMockCache();
				const dbOrg = { id: "org1", name: "DB Org" };
				const { db } = createMockDb([dbOrg]);

				const loader = createOrganizationLoader(db, mockCache);
				await loader.load("org1");

				// Verify mset was called with the fetched value using entityKey format
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("organization", "org1"),
							value: dbOrg,
						}),
					]),
				);
			});

			it("handles multiple organizations with mixed cache hits and misses", async () => {
				const cachedOrg = { id: "org1", name: "Cached Org" };
				const cachedValues = new Map([
					[entityKey("organization", "org1"), cachedOrg],
				]);
				const mockCache = createMockCache(cachedValues);
				const dbOrg = { id: "org2", name: "DB Org" };
				const { db, whereSpy } = createMockDb([dbOrg]);

				const loader = createOrganizationLoader(db, mockCache);
				const results = await Promise.all([
					loader.load("org1"),
					loader.load("org2"),
				]);

				// Verify both results returned correctly
				expect(results).toEqual([cachedOrg, dbOrg]);
				// Verify DB was hit only for cache miss (org2)
				expect(whereSpy).toHaveBeenCalledTimes(1);
				// Verify mset was called for the cache miss
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("organization", "org2"),
							value: dbOrg,
						}),
					]),
				);
			});
		});

		describe("createEventLoader cache", () => {
			it("calls mget/mset on cache miss and hits database", async () => {
				const mockCache = createMockCache();
				const { db, whereSpy } = createMockDb([
					{ id: "evt1", name: "Event A" },
				]);

				const loader = createEventLoader(db, mockCache);
				await loader.load("evt1");

				// Verify cache was checked (mget is called by wrapWithCache)
				expect(mockCache.mget).toHaveBeenCalled();
				// Verify result was cached (mset is called for cache misses)
				expect(mockCache.mset).toHaveBeenCalled();
				// Verify DB was hit since cache returned null
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database when cache is null", async () => {
				const { db, whereSpy } = createMockDb([
					{ id: "evt1", name: "Event A" },
				]);

				const loader = createEventLoader(db, null);
				await loader.load("evt1");

				// Verify DB was hit directly
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("returns cached event on cache hit and prevents DB calls", async () => {
				const cachedEvent = { id: "evt1", name: "Cached Event" };
				const cachedValues = new Map([
					[entityKey("event", "evt1"), cachedEvent],
				]);
				const mockCache = createMockCache(cachedValues);
				const { db, whereSpy } = createMockDb([]);

				const loader = createEventLoader(db, mockCache);
				const result = await loader.load("evt1");

				// Verify cached value returned
				expect(result).toEqual(cachedEvent);
				// Verify DB was NOT hit (cache hit)
				expect(whereSpy).not.toHaveBeenCalled();
			});

			it("stores fetched values in cache on cache miss", async () => {
				const mockCache = createMockCache();
				const dbEvent = { id: "evt1", name: "DB Event" };
				const { db } = createMockDb([dbEvent]);

				const loader = createEventLoader(db, mockCache);
				await loader.load("evt1");

				// Verify mset was called with the fetched value using entityKey format
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("event", "evt1"),
							value: dbEvent,
						}),
					]),
				);
			});

			it("handles multiple events with mixed cache hits and misses", async () => {
				const cachedEvent = { id: "evt1", name: "Cached Event" };
				const cachedValues = new Map([
					[entityKey("event", "evt1"), cachedEvent],
				]);
				const mockCache = createMockCache(cachedValues);
				const dbEvent = { id: "evt2", name: "DB Event" };
				const { db, whereSpy } = createMockDb([dbEvent]);

				const loader = createEventLoader(db, mockCache);
				const results = await Promise.all([
					loader.load("evt1"),
					loader.load("evt2"),
				]);

				// Verify both results returned correctly
				expect(results).toEqual([cachedEvent, dbEvent]);
				// Verify DB was hit only for cache miss (evt2)
				expect(whereSpy).toHaveBeenCalledTimes(1);
				// Verify mset was called for the cache miss
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("event", "evt2"),
							value: dbEvent,
						}),
					]),
				);
			});
		});

		describe("createUserLoader cache", () => {
			it("calls mget/mset on cache miss and hits database", async () => {
				const mockCache = createMockCache();
				const { db, whereSpy } = createMockDb([{ id: "u1", name: "User A" }]);

				const loader = createUserLoader(db, mockCache);
				await loader.load("u1");

				// Verify cache was checked (mget is called by wrapWithCache)
				expect(mockCache.mget).toHaveBeenCalled();
				// Verify result was cached (mset is called for cache misses)
				expect(mockCache.mset).toHaveBeenCalled();
				// Verify DB was hit since cache returned null
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database when cache is null", async () => {
				const { db, whereSpy } = createMockDb([{ id: "u1", name: "User A" }]);

				const loader = createUserLoader(db, null);
				await loader.load("u1");

				// Verify DB was hit directly
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("returns cached user on cache hit and prevents DB calls", async () => {
				const cachedUser = { id: "u1", name: "Cached User" };
				const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
				const mockCache = createMockCache(cachedValues);
				const { db, whereSpy } = createMockDb([]);

				const loader = createUserLoader(db, mockCache);
				const result = await loader.load("u1");

				// Verify cached value returned
				expect(result).toEqual(cachedUser);
				// Verify DB was NOT hit (cache hit)
				expect(whereSpy).not.toHaveBeenCalled();
			});

			it("stores fetched values in cache on cache miss", async () => {
				const mockCache = createMockCache();
				const dbUser = { id: "u1", name: "DB User" };
				const { db } = createMockDb([dbUser]);

				const loader = createUserLoader(db, mockCache);
				await loader.load("u1");

				// Verify mset was called with the fetched value using entityKey format
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("user", "u1"),
							value: dbUser,
						}),
					]),
				);
			});

			it("handles multiple users with mixed cache hits and misses", async () => {
				const cachedUser = { id: "u1", name: "Cached User" };
				const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
				const mockCache = createMockCache(cachedValues);
				const dbUser = { id: "u2", name: "DB User" };
				const { db, whereSpy } = createMockDb([dbUser]);

				const loader = createUserLoader(db, mockCache);
				const results = await Promise.all([
					loader.load("u1"),
					loader.load("u2"),
				]);

				// Verify both results returned correctly
				expect(results).toEqual([cachedUser, dbUser]);
				// Verify DB was hit only for cache miss (u2)
				expect(whereSpy).toHaveBeenCalledTimes(1);
				// Verify mset was called for the cache miss
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("user", "u2"),
							value: dbUser,
						}),
					]),
				);
			});
		});

		describe("createActionItemLoader cache", () => {
			it("calls mget/mset on cache miss and hits database", async () => {
				const mockCache = createMockCache();
				const { db, whereSpy } = createMockDb([
					{ id: "ai1", organizationId: "org1" },
				]);

				const loader = createActionItemLoader(db, mockCache);
				await loader.load("ai1");

				// Verify cache was checked (mget is called by wrapWithCache)
				expect(mockCache.mget).toHaveBeenCalled();
				// Verify result was cached (mset is called for cache misses)
				expect(mockCache.mset).toHaveBeenCalled();
				// Verify DB was hit since cache returned null
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database when cache is null", async () => {
				const { db, whereSpy } = createMockDb([
					{ id: "ai1", organizationId: "org1" },
				]);

				const loader = createActionItemLoader(db, null);
				await loader.load("ai1");

				// Verify DB was hit directly
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("returns cached actionItem on cache hit and prevents DB calls", async () => {
				const cachedActionItem = { id: "ai1", organizationId: "org1" };
				const cachedValues = new Map([
					[entityKey("actionItem", "ai1"), cachedActionItem],
				]);
				const mockCache = createMockCache(cachedValues);
				const { db, whereSpy } = createMockDb([]);

				const loader = createActionItemLoader(db, mockCache);
				const result = await loader.load("ai1");

				// Verify cached value returned
				expect(result).toEqual(cachedActionItem);
				// Verify DB was NOT hit (cache hit)
				expect(whereSpy).not.toHaveBeenCalled();
			});

			it("stores fetched values in cache on cache miss", async () => {
				const mockCache = createMockCache();
				const dbActionItem = { id: "ai1", organizationId: "org1" };
				const { db } = createMockDb([dbActionItem]);

				const loader = createActionItemLoader(db, mockCache);
				await loader.load("ai1");

				// Verify mset was called with the fetched value using entityKey format
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("actionItem", "ai1"),
							value: dbActionItem,
						}),
					]),
				);
			});

			it("handles multiple actionItems with mixed cache hits and misses", async () => {
				const cachedActionItem = { id: "ai1", organizationId: "org1" };
				const cachedValues = new Map([
					[entityKey("actionItem", "ai1"), cachedActionItem],
				]);
				const mockCache = createMockCache(cachedValues);
				const dbActionItem = { id: "ai2", organizationId: "org1" };
				const { db, whereSpy } = createMockDb([dbActionItem]);

				const loader = createActionItemLoader(db, mockCache);
				const results = await Promise.all([
					loader.load("ai1"),
					loader.load("ai2"),
				]);

				// Verify both results returned correctly
				expect(results).toEqual([cachedActionItem, dbActionItem]);
				// Verify DB was hit only for cache miss (ai2)
				expect(whereSpy).toHaveBeenCalledTimes(1);
				// Verify mset was called for the cache miss
				expect(mockCache.mset).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({
							key: entityKey("actionItem", "ai2"),
							value: dbActionItem,
						}),
					]),
				);
			});
		});

		describe("cache error handling", () => {
			it("falls back to database when cache.mget throws an error", async () => {
				const mockCache = {
					...createMockCache(),
					mget: vi.fn().mockRejectedValue(new Error("Cache unavailable")),
				};
				const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);

				const loader = createOrganizationLoader(db, mockCache);
				const result = await loader.load("org1");

				// Should still return DB result despite cache error
				expect(result).toEqual({ id: "org1", name: "Org A" });
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("returns result even when cache.mset throws an error", async () => {
				const mockCache = {
					...createMockCache(),
					mset: vi.fn().mockRejectedValue(new Error("Cache write failed")),
				};
				const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);

				const loader = createOrganizationLoader(db, mockCache);
				const result = await loader.load("org1");

				// Should still return DB result despite cache write error
				expect(result).toEqual({ id: "org1", name: "Org A" });
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database for event loader when cache.mget throws", async () => {
				const mockCache = {
					...createMockCache(),
					mget: vi.fn().mockRejectedValue(new Error("Cache unavailable")),
				};
				const { db, whereSpy } = createMockDb([
					{ id: "evt1", name: "Event A" },
				]);

				const loader = createEventLoader(db, mockCache);
				const result = await loader.load("evt1");

				// Should still return DB result despite cache error
				expect(result).toEqual({ id: "evt1", name: "Event A" });
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database for user loader when cache.mget throws", async () => {
				const mockCache = {
					...createMockCache(),
					mget: vi.fn().mockRejectedValue(new Error("Cache unavailable")),
				};
				const { db, whereSpy } = createMockDb([{ id: "u1", name: "User A" }]);

				const loader = createUserLoader(db, mockCache);
				const result = await loader.load("u1");

				// Should still return DB result despite cache error
				expect(result).toEqual({ id: "u1", name: "User A" });
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});

			it("falls back to database for actionItem loader when cache.mget throws", async () => {
				const mockCache = {
					...createMockCache(),
					mget: vi.fn().mockRejectedValue(new Error("Cache unavailable")),
				};
				const { db, whereSpy } = createMockDb([
					{ id: "ai1", organizationId: "org1" },
				]);

				const loader = createActionItemLoader(db, mockCache);
				const result = await loader.load("ai1");

				// Should still return DB result despite cache error
				expect(result).toEqual({ id: "ai1", organizationId: "org1" });
				expect(whereSpy).toHaveBeenCalledTimes(1);
			});
		});
	});
});
