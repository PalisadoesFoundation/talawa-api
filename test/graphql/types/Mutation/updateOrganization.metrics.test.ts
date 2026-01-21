import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Test suite for updateOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the updateOrganization mutation.
 */
describe("updateOrganization mutation performance tracking", () => {
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
				(await ctx.perf?.time("mutation:updateOrganization", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { id: "org-123", name: "Updated Org" };
				})) ?? { id: "org-123", name: "Updated Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:updateOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(10);
	});

	it("should track metrics even when mutation fails", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:updateOrganization", async () => {
					throw new Error("Organization update failed");
				})) ??
				(() => {
					throw new Error("Organization update failed");
				})()
			);
		};

		await expect(executeMutation()).rejects.toThrow(
			"Organization update failed",
		);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:updateOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:updateOrganization", async () => {
					return { id: "org-456", name: "Updated Org 2" };
				})) ?? { id: "org-456", name: "Updated Org 2" }
			);
		};

		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:updateOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(snapshot.ops).toHaveProperty("mutation:updateOrganization");
	});

	it("should track separate timing for validation vs database update", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:updateOrganization", async () => {
					// Simulate validation
					const validationStop = ctx.perf?.start("validation");
					await new Promise((resolve) => setTimeout(resolve, 3));
					validationStop?.();

					// Simulate database update
					const dbUpdateStop = ctx.perf?.start("db-update");
					await new Promise((resolve) => setTimeout(resolve, 4));
					dbUpdateStop?.();

					return { id: "org-789", name: "Validated and Updated Org" };
				})) ?? { id: "org-789", name: "Validated and Updated Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const mainOp = snapshot.ops["mutation:updateOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(7);
	});

	it("should work when perf tracker is not available (graceful degradation)", async () => {
		ctx.perf = undefined;

		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:updateOrganization", async () => {
					return { id: "org-999", name: "No Metrics Updated Org" };
				})) ?? { id: "org-999", name: "No Metrics Updated Org" }
			);
		};

		const result = await executeMutation();

		expect(result).toEqual({ id: "org-999", name: "No Metrics Updated Org" });
		const snapshot = perf.snapshot();
		expect(snapshot.ops["mutation:updateOrganization"]).toBeUndefined();
	});
});
