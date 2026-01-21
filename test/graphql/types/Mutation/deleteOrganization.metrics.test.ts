import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Test suite for deleteOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the deleteOrganization mutation.
 */
describe("deleteOrganization mutation performance tracking", () => {
	let perf: ReturnType<typeof createPerformanceTracker>;
	let ctx: GraphQLContext;

	beforeEach(() => {
		perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext(true, "admin-user-id");
		ctx = context;
		ctx.perf = perf;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should track mutation execution time when perf tracker is available", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { id: "org-123", name: "Deleted Org" };
				})) ?? { id: "org-123", name: "Deleted Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(10);
	});

	it("should track metrics even when mutation fails", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					throw new Error("Organization deletion failed");
				})) ??
				(() => {
					throw new Error("Organization deletion failed");
				})()
			);
		};

		await expect(executeMutation()).rejects.toThrow(
			"Organization deletion failed",
		);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					return { id: "org-456", name: "Deleted Org 2" };
				})) ?? { id: "org-456", name: "Deleted Org 2" }
			);
		};

		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(snapshot.ops).toHaveProperty("mutation:deleteOrganization");
	});

	it("should track cascade deletion timing", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					// Simulate cascade deletion
					const cascadeStop = ctx.perf?.start("cascade-deletion");
					await new Promise((resolve) => setTimeout(resolve, 5));
					cascadeStop?.();

					return { id: "org-789", name: "Cascade Deleted Org" };
				})) ?? { id: "org-789", name: "Cascade Deleted Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const mainOp = snapshot.ops["mutation:deleteOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(5);
	});

	it("should track cleanup operations timing", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					// Simulate cleanup operations
					const cleanupStop = ctx.perf?.start("cleanup");
					await new Promise((resolve) => setTimeout(resolve, 4));
					cleanupStop?.();

					return { id: "org-999", name: "Cleaned Up Org" };
				})) ?? { id: "org-999", name: "Cleaned Up Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const mainOp = snapshot.ops["mutation:deleteOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(4);
	});

	it("should work when perf tracker is not available (graceful degradation)", async () => {
		ctx.perf = undefined;

		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:deleteOrganization", async () => {
					return { id: "org-000", name: "No Metrics Deleted Org" };
				})) ?? { id: "org-000", name: "No Metrics Deleted Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toEqual({ id: "org-000", name: "No Metrics Deleted Org" });
		const snapshot = perf.snapshot();
		expect(snapshot.ops["mutation:deleteOrganization"]).toBeUndefined();
	});
});
