import { describe, expect, it, vi } from "vitest";
import { executeMutation } from "~/src/graphql/utils/withMutationMetrics";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("withMutationMetrics", () => {
	describe("executeMutation", () => {
		it("should track mutation timing when perf is available", async () => {
			const perf = createPerformanceTracker();
			const ctx = { perf };
			const expectedResult = { id: "123", name: "test" };

			const result = await executeMutation("createUser", ctx, async () => {
				return expectedResult;
			});

			expect(result).toEqual(expectedResult);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should execute mutation without tracking when perf is undefined", async () => {
			const ctx = { perf: undefined };
			const expectedResult = { id: "456", name: "test" };

			const result = await executeMutation("createUser", ctx, async () => {
				return expectedResult;
			});

			expect(result).toEqual(expectedResult);
		});

		it("should execute mutation without tracking when perf is not present", async () => {
			const ctx = {};
			const expectedResult = { success: true };

			const result = await executeMutation(
				"deleteOrganization",
				ctx,
				async () => {
					return expectedResult;
				},
			);

			expect(result).toEqual(expectedResult);
		});

		it("should propagate errors while still tracking metrics", async () => {
			const perf = createPerformanceTracker();
			const ctx = { perf };
			const testError = new Error("Mutation failed");

			await expect(
				executeMutation("createOrganization", ctx, async () => {
					throw testError;
				}),
			).rejects.toThrow("Mutation failed");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should propagate errors without perf tracker", async () => {
			const ctx = {};
			const testError = new Error("No auth");

			await expect(
				executeMutation("updateOrganization", ctx, async () => {
					throw testError;
				}),
			).rejects.toThrow("No auth");
		});

		it("should track multiple mutation calls separately", async () => {
			const perf = createPerformanceTracker();
			const ctx = { perf };

			await executeMutation("createEvent", ctx, async () => ({ id: "1" }));
			await executeMutation("createEvent", ctx, async () => ({ id: "2" }));
			await executeMutation("createEvent", ctx, async () => ({ id: "3" }));

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(3);
		});

		it("should track different mutations independently", async () => {
			const perf = createPerformanceTracker();
			const ctx = { perf };

			await executeMutation("createUser", ctx, async () => ({ id: "user1" }));
			await executeMutation("createOrganization", ctx, async () => ({
				id: "org1",
			}));
			await executeMutation("deleteOrganization", ctx, async () => ({
				id: "org1",
			}));

			const snapshot = perf.snapshot();

			expect(snapshot.ops["mutation:createUser"]?.count).toBe(1);
			expect(snapshot.ops["mutation:createOrganization"]?.count).toBe(1);
			expect(snapshot.ops["mutation:deleteOrganization"]?.count).toBe(1);
		});

		it("should handle async operations correctly", async () => {
			const perf = createPerformanceTracker();
			const ctx = { perf };
			const asyncFn = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { delayed: true };
			});

			const result = await executeMutation("createUser", ctx, asyncFn);

			expect(result).toEqual({ delayed: true });
			expect(asyncFn).toHaveBeenCalledTimes(1);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.ms).toBeDefined();
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});
});
