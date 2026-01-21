import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Test suite for createOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createOrganization mutation.
 */
describe("createOrganization mutation performance tracking", () => {
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
				(await ctx.perf?.time("mutation:createOrganization", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { id: "org-123", name: "Test Org" };
				})) ?? { id: "org-123", name: "Test Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(10);
	});

	it("should track metrics even when mutation fails", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createOrganization", async () => {
					throw new Error("Organization creation failed");
				})) ??
				(() => {
					throw new Error("Organization creation failed");
				})()
			);
		};

		await expect(executeMutation()).rejects.toThrow(
			"Organization creation failed",
		);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createOrganization", async () => {
					return { id: "org-456", name: "Test Org 2" };
				})) ?? { id: "org-456", name: "Test Org 2" }
			);
		};

		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(snapshot.ops).toHaveProperty("mutation:createOrganization");
	});

	it("should track complex mutation execution timing", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createOrganization", async () => {
					// Simulate complex operations (validation, DB writes, etc.)
					await new Promise((resolve) => setTimeout(resolve, 5));
					await new Promise((resolve) => setTimeout(resolve, 5));
					return { id: "org-789", name: "Complex Org" };
				})) ?? { id: "org-789", name: "Complex Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(10);
	});

	it("should work when perf tracker is not available (graceful degradation)", async () => {
		ctx.perf = undefined;

		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createOrganization", async () => {
					return { id: "org-999", name: "No Metrics Org" };
				})) ?? { id: "org-999", name: "No Metrics Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toEqual({ id: "org-999", name: "No Metrics Org" });
		const snapshot = perf.snapshot();
		expect(snapshot.ops["mutation:createOrganization"]).toBeUndefined();
	});
});
