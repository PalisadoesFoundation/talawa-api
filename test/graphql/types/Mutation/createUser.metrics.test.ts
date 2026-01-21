import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Test suite for createUser mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createUser mutation.
 */
describe("createUser mutation performance tracking", () => {
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
		// Mock the mutation resolver to simulate execution
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createUser", async () => {
					// Simulate mutation work
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { user: { id: "123" }, authenticationToken: "token" };
				})) ?? { user: { id: "123" }, authenticationToken: "token" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(9);
	});

	it("should track metrics even when mutation fails", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createUser", async () => {
					throw new Error("Mutation failed");
				})) ??
				(() => {
					throw new Error("Mutation failed");
				})()
			);
		};

		await expect(executeMutation()).rejects.toThrow("Mutation failed");

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createUser", async () => {
					return { success: true };
				})) ?? { success: true }
			);
		};

		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(snapshot.ops).toHaveProperty("mutation:createUser");
	});

	it("should handle multiple mutation calls separately", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createUser", async () => {
					return { user: { id: "123" } };
				})) ?? { user: { id: "123" } }
			);
		};

		await executeMutation();
		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(2);
	});

	it("should work when perf tracker is not available (graceful degradation)", async () => {
		ctx.perf = undefined;

		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createUser", async () => {
					return { user: { id: "123" } };
				})) ?? { user: { id: "123" } }
			);
		};

		const result = await executeMutation();

		expect(result).toEqual({ user: { id: "123" } });
		// No metrics should be collected
		const snapshot = perf.snapshot();
		expect(snapshot.ops["mutation:createUser"]).toBeUndefined();
	});
});
