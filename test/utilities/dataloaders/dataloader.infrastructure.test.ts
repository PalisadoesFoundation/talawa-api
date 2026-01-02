import { describe, expect, it, vi } from "vitest";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import { createDataloaders } from "~/src/utilities/dataloaders";
import { createActionItemLoader } from "~/src/utilities/dataloaders/actionItemLoader";
import { createEventLoader } from "~/src/utilities/dataloaders/eventLoader";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";
import { createUserLoader } from "~/src/utilities/dataloaders/userLoader";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

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
 * Creates a mock PerformanceTracker for testing.
 */
function createMockPerf(): PerformanceTracker {
	return {
		time: vi.fn((_label, fn) => fn()),
		start: vi.fn(() => vi.fn()),
		trackDbQuery: vi.fn(),
		trackCacheHit: vi.fn(),
		trackCacheMiss: vi.fn(),
		snapshot: vi.fn(() => ({
			timers: {},
			counters: {},
		})),
	} as unknown as PerformanceTracker;
}

describe("DataLoader infrastructure", () => {
	describe("createUserLoader", () => {
		it("returns results in the same order as keys and batches calls", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "u2", name: "B" },
				{ id: "u1", name: "A" },
			]);
			const perf = createMockPerf();

			const loader = createUserLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createUserLoader(db, perf);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "u1", name: "A" }]);
			const perf = createMockPerf();

			const loader = createUserLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createOrganizationLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createOrganizationLoader(db, perf);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "org1", name: "Org A" }]);
			const perf = createMockPerf();

			const loader = createOrganizationLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createEventLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createEventLoader(db, perf);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([{ id: "evt1", name: "Event A" }]);
			const perf = createMockPerf();

			const loader = createEventLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createActionItemLoader(db, perf);

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
			const perf = createMockPerf();

			const loader = createActionItemLoader(db, perf);

			const result = await loader.load("nonexistent");
			expect(result).toBeNull();
		});

		it("caches results within the same loader instance", async () => {
			const { db, whereSpy } = createMockDb([
				{ id: "ai1", organizationId: "org1" },
			]);
			const perf = createMockPerf();

			const loader = createActionItemLoader(db, perf);

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
			const perf = createMockPerf();

			const loaders = createDataloaders(db, perf);

			expect(loaders).toHaveProperty("user");
			expect(loaders).toHaveProperty("organization");
			expect(loaders).toHaveProperty("event");
			expect(loaders).toHaveProperty("actionItem");
		});

		it("creates independent loader instances on each call", () => {
			const { db } = createMockDb([]);
			const perf = createMockPerf();

			const loaders1 = createDataloaders(db, perf);
			const loaders2 = createDataloaders(db, perf);

			// Each call should create new loader instances (request-scoped)
			expect(loaders1.user).not.toBe(loaders2.user);
			expect(loaders1.organization).not.toBe(loaders2.organization);
			expect(loaders1.event).not.toBe(loaders2.event);
			expect(loaders1.actionItem).not.toBe(loaders2.actionItem);
		});
	});
});
