import { afterEach, describe, expect, it, vi } from "vitest";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import { type CacheService, entityKey } from "~/src/services/caching";
import { createDataloaders } from "~/src/utilities/dataloaders";
import { createActionItemLoader } from "~/src/utilities/dataloaders/actionItemLoader";
import { createEventLoader } from "~/src/utilities/dataloaders/eventLoader";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";
import { createUserLoader } from "~/src/utilities/dataloaders/userLoader";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";

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
 * Creates a mock DrizzleClient with sequential responses for testing DataLoaders.
 * Each call to where() will return the next result set in the array.
 * If where() is called more times than entries in mockResultsArray, it returns an empty array
 * to prevent undefined responses that could mask test bugs.
 * Returns both the mock db and a spy for the where function.
 */
function createSequentialMockDb<T>(mockResultsArray: T[][]) {
	const whereSpy = vi.fn();
	// Set up sequential responses using mockResolvedValueOnce for each result set
	for (const mockResults of mockResultsArray) {
		whereSpy.mockResolvedValueOnce(mockResults);
	}
	// Add fallback for extra calls to prevent undefined responses
	whereSpy.mockResolvedValue([]);
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

describe("DataLoader Metrics Integration (PR 3)", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic Metrics Collection", () => {
		it("tracks metrics when DataLoaders execute batch functions", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User A" }]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
			expect(snapshot.ops["db:users.byId"]?.ms).toBeGreaterThanOrEqual(0);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("wrapBatchWithMetrics correctly wraps batch functions", async () => {
			const perf = createPerformanceTracker();
			const batchFn = vi.fn().mockResolvedValue([{ id: "u1", name: "User A" }]);

			const wrapped = wrapBatchWithMetrics("users.byId", perf, batchFn);
			const result = await wrapped(["u1"]);

			expect(result).toEqual([{ id: "u1", name: "User A" }]);
			expect(batchFn).toHaveBeenCalledTimes(1);
			expect(batchFn).toHaveBeenCalledWith(["u1"]);

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("operation names are correct for all loaders", async () => {
			const perf = createPerformanceTracker();
			const { db } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }], // user loader
				[{ id: "org1", name: "Org 1" }], // organization loader
				[{ id: "evt1", name: "Event 1" }], // event loader
				[{ id: "ai1", organizationId: "org1" }], // actionItem loader
			]);

			const userLoader = createUserLoader(db, null, perf);
			const orgLoader = createOrganizationLoader(db, null, perf);
			const eventLoader = createEventLoader(db, null, perf);
			const actionItemLoader = createActionItemLoader(db, null, perf);

			await userLoader.load("u1");
			await orgLoader.load("org1");
			await eventLoader.load("evt1");
			await actionItemLoader.load("ai1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:organizations.byId"]).toBeDefined();
			expect(snapshot.ops["db:events.byId"]).toBeDefined();
			expect(snapshot.ops["db:actionItems.byId"]).toBeDefined();
		});

		it("metrics tracking doesn't break DataLoader functionality", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([
				{ id: "u2", name: "B" },
				{ id: "u1", name: "A" },
			]);

			const loader = createUserLoader(db, null, perf);

			const p1 = loader.load("u1");
			const p2 = loader.load("u2");

			const results = await Promise.all([p1, p2]);

			// Verify DataLoader still works correctly
			expect(results).toEqual([
				{ id: "u1", name: "A" },
				{ id: "u2", name: "B" },
			]);
			expect(whereSpy).toHaveBeenCalledTimes(1);

			// Verify metrics were tracked
			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("timing is recorded in performance tracker snapshot", async () => {
			const perf = createPerformanceTracker();
			const { db } = createMockDb([{ id: "u1", name: "User A" }]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["db:users.byId"];
			expect(op).toBeDefined();
			expect(op?.ms).toBeGreaterThanOrEqual(0);
			expect(snapshot.totalMs).toBeGreaterThanOrEqual(0);
			expect(snapshot.totalOps).toBe(1);
		});
	});

	describe("All Four DataLoaders", () => {
		it("tracks metrics for user loader with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			const userOp = snapshot.ops["db:users.byId"];
			expect(userOp).toBeDefined();
			expect(userOp?.count).toBe(1);
			expect(userOp?.ms).toBeGreaterThanOrEqual(0);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("tracks metrics for organization loader with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org 1" }]);

			const loader = createOrganizationLoader(db, null, perf);
			await loader.load("org1");

			const snapshot = perf.snapshot();
			const orgOp = snapshot.ops["db:organizations.byId"];
			expect(orgOp).toBeDefined();
			expect(orgOp?.count).toBe(1);
			expect(orgOp?.ms).toBeGreaterThanOrEqual(0);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("tracks metrics for event loader with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "evt1", name: "Event 1" }]);

			const loader = createEventLoader(db, null, perf);
			await loader.load("evt1");

			const snapshot = perf.snapshot();
			const eventOp = snapshot.ops["db:events.byId"];
			expect(eventOp).toBeDefined();
			expect(eventOp?.count).toBe(1);
			expect(eventOp?.ms).toBeGreaterThanOrEqual(0);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("tracks metrics for actionItem loader with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([
				{ id: "ai1", organizationId: "org1" },
			]);

			const loader = createActionItemLoader(db, null, perf);
			await loader.load("ai1");

			const snapshot = perf.snapshot();
			const actionItemOp = snapshot.ops["db:actionItems.byId"];
			expect(actionItemOp).toBeDefined();
			expect(actionItemOp?.count).toBe(1);
			expect(actionItemOp?.ms).toBeGreaterThanOrEqual(0);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("Metrics Integration", () => {
		it("createDataloaders function accepts perf tracker parameter", () => {
			const perf = createPerformanceTracker();
			const { db } = createMockDb([]);

			const loaders = createDataloaders(db, null, perf);

			expect(loaders).toHaveProperty("user");
			expect(loaders).toHaveProperty("organization");
			expect(loaders).toHaveProperty("event");
			expect(loaders).toHaveProperty("actionItem");
		});

		it("perf tracker is passed to all loader wrappers", async () => {
			const perf = createPerformanceTracker();
			const { db } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }], // user loader
				[{ id: "org1", name: "Org 1" }], // organization loader
				[{ id: "evt1", name: "Event 1" }], // event loader
				[{ id: "ai1", organizationId: "org1" }], // actionItem loader
			]);

			const loaders = createDataloaders(db, null, perf);

			await loaders.user.load("u1");
			await loaders.organization.load("org1");
			await loaders.event.load("evt1");
			await loaders.actionItem.load("ai1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:organizations.byId"]).toBeDefined();
			expect(snapshot.ops["db:events.byId"]).toBeDefined();
			expect(snapshot.ops["db:actionItems.byId"]).toBeDefined();
		});

		it("metrics appear in snapshot after loader execution", async () => {
			const perf = createPerformanceTracker();
			const { db } = createMockDb([{ id: "u1", name: "User 1" }]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
		});

		it("ops field contains correct operation names", async () => {
			const perf = createPerformanceTracker();
			const { db } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }],
				[{ id: "org1", name: "Org 1" }],
				[{ id: "evt1", name: "Event 1" }],
				[{ id: "ai1", organizationId: "org1" }],
			]);

			const loaders = createDataloaders(db, null, perf);

			await loaders.user.load("u1");
			await loaders.organization.load("org1");
			await loaders.event.load("evt1");
			await loaders.actionItem.load("ai1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops).toHaveProperty("db:users.byId");
			expect(snapshot.ops).toHaveProperty("db:organizations.byId");
			expect(snapshot.ops).toHaveProperty("db:events.byId");
			expect(snapshot.ops).toHaveProperty("db:actionItems.byId");
		});

		it("totalMs and totalOps are incremented", async () => {
			const perf = createPerformanceTracker();
			const { db } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }],
				[{ id: "u2", name: "User 2" }],
			]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");
			await loader.load("u2");

			const snapshot = perf.snapshot();
			expect(snapshot.totalOps).toBeGreaterThanOrEqual(2);
			expect(snapshot.totalMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Backward Compatibility", () => {
		it("DataLoaders work without perf tracker (null)", async () => {
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const loader = createUserLoader(db, null, null);
			const result = await loader.load("u1");

			expect(result).toEqual({ id: "u1", name: "User 1" });
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("DataLoaders work without perf tracker (undefined)", async () => {
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			const loader = createUserLoader(db, null, undefined);
			const result = await loader.load("u1");

			expect(result).toEqual({ id: "u1", name: "User 1" });
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("createDataloaders(db, cache, null) doesn't crash", async () => {
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const loaders = createDataloaders(db, null, null);
			const result = await loaders.user.load("u1");

			expect(result).toEqual({ id: "u1", name: "User 1" });
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("individual loaders work with null perf tracker", async () => {
			const { db, whereSpy } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }],
				[{ id: "org1", name: "Org 1" }],
				[{ id: "evt1", name: "Event 1" }],
				[{ id: "ai1", organizationId: "org1" }],
			]);

			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const userLoader = createUserLoader(db, null, null);
			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const orgLoader = createOrganizationLoader(db, null, null);
			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const eventLoader = createEventLoader(db, null, null);
			// @ts-expect-error - Testing runtime null behavior, TypeScript expects undefined
			const actionItemLoader = createActionItemLoader(db, null, null);

			const results = await Promise.all([
				userLoader.load("u1"),
				orgLoader.load("org1"),
				eventLoader.load("evt1"),
				actionItemLoader.load("ai1"),
			]);

			expect(results[0]).toEqual({ id: "u1", name: "User 1" });
			expect(results[1]).toEqual({ id: "org1", name: "Org 1" });
			expect(results[2]).toEqual({ id: "evt1", name: "Event 1" });
			expect(results[3]).toEqual({ id: "ai1", organizationId: "org1" });
			expect(whereSpy).toHaveBeenCalledTimes(4);
		});
	});

	describe("Cache + Metrics Interaction", () => {
		it("metrics wrapping works with cache wrapping", async () => {
			const perf = createPerformanceTracker();
			const cachedUser = { id: "u1", name: "Cached User" };
			const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
			const mockCache = createMockCache(cachedValues);
			const { db, whereSpy } = createMockDb([]);

			const loader = createUserLoader(db, mockCache, perf);
			const result = await loader.load("u1");

			expect(result).toEqual(cachedUser);
			expect(whereSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("cache hits are recorded separately from DB metrics", async () => {
			const perf = createPerformanceTracker();
			const cachedUser = { id: "u1", name: "Cached User" };
			const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
			const mockCache = createMockCache(cachedValues);
			const { db, whereSpy } = createMockDb([]);

			const loader = createUserLoader(db, mockCache, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			// Metrics should still be tracked even for cache hits
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
			expect(whereSpy).not.toHaveBeenCalled();
		});

		it("cache misses trigger DB calls with metrics", async () => {
			const perf = createPerformanceTracker();
			const mockCache = createMockCache();
			const dbUser = { id: "u1", name: "DB User" };
			const { db, whereSpy } = createMockDb([dbUser]);

			const loader = createUserLoader(db, mockCache, perf);
			const result = await loader.load("u1");

			expect(result).toEqual(dbUser);
			expect(whereSpy).toHaveBeenCalledTimes(1);

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("both cache and DB metrics are tracked correctly", async () => {
			const perf = createPerformanceTracker();
			const cachedUser = { id: "u1", name: "Cached User" };
			const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
			const mockCache = createMockCache(cachedValues);
			const dbUser = { id: "u2", name: "DB User" };
			const { db, whereSpy } = createMockDb([dbUser]);

			const loader = createUserLoader(db, mockCache, perf);

			// Cache hit
			const result1 = await loader.load("u1");
			// Cache miss
			const result2 = await loader.load("u2");

			expect(result1).toEqual(cachedUser);
			expect(result2).toEqual(dbUser);
			expect(whereSpy).toHaveBeenCalledTimes(1);

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(2);
		});
	});

	describe("Error Scenarios", () => {
		it("metrics are recorded even when batch function throws error", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);
			whereSpy.mockRejectedValueOnce(new Error("Database error"));

			const loader = createUserLoader(db, null, perf);

			await expect(loader.load("u1")).rejects.toThrow("Database error");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("DataLoader failures don't break metrics tracking", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([]);
			whereSpy.mockRejectedValueOnce(new Error("DB error"));

			const loader = createUserLoader(db, null, perf);

			await expect(loader.load("u1")).rejects.toThrow("DB error");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("timing is recorded for failed operations", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);
			whereSpy.mockRejectedValueOnce(new Error("Database error"));

			const loader = createUserLoader(db, null, perf);

			await expect(loader.load("u1")).rejects.toThrow("Database error");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["db:users.byId"];
			expect(op).toBeDefined();
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("wrapBatchWithMetrics throws for empty operation name", async () => {
			const perf = createPerformanceTracker();
			const batchFn = vi.fn().mockResolvedValue([]);

			const wrapped = wrapBatchWithMetrics("", perf, batchFn);

			await expect(wrapped(["id1"])).rejects.toThrow(
				"Operation name cannot be empty or whitespace",
			);
			expect(batchFn).not.toHaveBeenCalled();
		});

		it("wrapBatchWithMetrics throws for whitespace-only operation name", async () => {
			const perf = createPerformanceTracker();
			const batchFn = vi.fn().mockResolvedValue([]);

			const wrapped = wrapBatchWithMetrics("   ", perf, batchFn);

			await expect(wrapped(["id1"])).rejects.toThrow(
				"Operation name cannot be empty or whitespace",
			);
			expect(batchFn).not.toHaveBeenCalled();
		});
	});

	describe("Concurrent Usage", () => {
		it("handles multiple concurrent DataLoader calls", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([
				{ id: "u1", name: "User 1" },
				{ id: "u2", name: "User 2" },
				{ id: "u3", name: "User 3" },
			]);

			const loader = createUserLoader(db, null, perf);

			const p1 = loader.load("u1");
			const p2 = loader.load("u2");
			const p3 = loader.load("u3");

			const results = await Promise.all([p1, p2, p3]);

			expect(results).toEqual([
				{ id: "u1", name: "User 1" },
				{ id: "u2", name: "User 2" },
				{ id: "u3", name: "User 3" },
			]);
			expect(whereSpy).toHaveBeenCalledTimes(1);

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
		});

		it("metrics aggregate correctly across batched calls", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([
				{ id: "u1", name: "User 1" },
				{ id: "u2", name: "User 2" },
			]);

			const loader = createUserLoader(db, null, perf);

			await Promise.all([loader.load("u1"), loader.load("u2")]);

			const snapshot = perf.snapshot();
			// Even though we loaded 2 items, it's one batch call
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("each batch call is tracked separately in metrics", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }],
				[{ id: "u2", name: "User 2" }],
			]);

			const loader = createUserLoader(db, null, perf);

			// First batch
			await loader.load("u1");
			// Second batch (different tick)
			await new Promise((resolve) => setTimeout(resolve, 10));
			await loader.load("u2");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(2);
			expect(whereSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("Integration Tests", () => {
		it("works with real performance tracker (not mocks)", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			const loader = createUserLoader(db, null, perf);
			await loader.load("u1");

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
			expect(whereSpy).toHaveBeenCalledTimes(1);
		});

		it("works with mock database (existing pattern: createMockDb)", async () => {
			const perf = createPerformanceTracker();
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "User 1" }]);

			const loader = createUserLoader(db, null, perf);
			const result = await loader.load("u1");

			expect(result).toEqual({ id: "u1", name: "User 1" });
			expect(whereSpy).toHaveBeenCalledTimes(1);

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
		});

		it("works with mock cache (existing pattern: createMockCache)", async () => {
			const perf = createPerformanceTracker();
			const cachedUser = { id: "u1", name: "Cached User" };
			const cachedValues = new Map([[entityKey("user", "u1"), cachedUser]]);
			const mockCache = createMockCache(cachedValues);
			const { db, whereSpy } = createMockDb([]);

			const loader = createUserLoader(db, mockCache, perf);
			const result = await loader.load("u1");

			expect(result).toEqual(cachedUser);
			expect(whereSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
		});

		it("end-to-end: create loaders → load data → verify metrics", async () => {
			const perf = createPerformanceTracker();
			const { db } = createSequentialMockDb([
				[{ id: "u1", name: "User 1" }],
				[{ id: "org1", name: "Org 1" }],
				[{ id: "evt1", name: "Event 1" }],
				[{ id: "ai1", organizationId: "org1" }],
			]);

			const loaders = createDataloaders(db, null, perf);

			await loaders.user.load("u1");
			await loaders.organization.load("org1");
			await loaders.event.load("evt1");
			await loaders.actionItem.load("ai1");

			const snapshot = perf.snapshot();

			// Verify all metrics are present
			expect(snapshot.ops["db:users.byId"]).toBeDefined();
			expect(snapshot.ops["db:organizations.byId"]).toBeDefined();
			expect(snapshot.ops["db:events.byId"]).toBeDefined();
			expect(snapshot.ops["db:actionItems.byId"]).toBeDefined();

			// Verify counts
			expect(snapshot.ops["db:users.byId"]?.count).toBe(1);
			expect(snapshot.ops["db:organizations.byId"]?.count).toBe(1);
			expect(snapshot.ops["db:events.byId"]?.count).toBe(1);
			expect(snapshot.ops["db:actionItems.byId"]?.count).toBe(1);

			// Verify timing
			expect(snapshot.ops["db:users.byId"]?.ms).toBeGreaterThanOrEqual(0);
			expect(snapshot.ops["db:organizations.byId"]?.ms).toBeGreaterThanOrEqual(
				0,
			);
			expect(snapshot.ops["db:events.byId"]?.ms).toBeGreaterThanOrEqual(0);
			expect(snapshot.ops["db:actionItems.byId"]?.ms).toBeGreaterThanOrEqual(0);

			// Verify totals
			expect(snapshot.totalOps).toBeGreaterThanOrEqual(4);
			expect(snapshot.totalMs).toBeGreaterThanOrEqual(0);
		});
	});
});
