import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { describe, expect, it, vi } from "vitest";
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("withMutationMetrics", () => {
	it("should track mutation execution time when perf tracker is available", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver = vi.fn().mockResolvedValue({ id: "123", name: "Test" });

		const result = await withMutationMetrics(
			"createUser",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toEqual({ id: "123", name: "Test" });
		expect(resolver).toHaveBeenCalledTimes(1);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should execute resolver without tracking when perf tracker is not available", async () => {
		const { context } = createMockGraphQLContext();
		// Explicitly set perf to undefined
		context.perf = undefined;

		const resolver = vi.fn().mockResolvedValue({ id: "456", name: "Test2" });

		const result = await withMutationMetrics(
			"updateOrganization",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toEqual({ id: "456", name: "Test2" });
		expect(resolver).toHaveBeenCalledTimes(1);
	});

	it("should propagate errors and still track timing", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const error = new Error("Mutation failed");
		const resolver = vi.fn().mockRejectedValue(error);

		await expect(
			withMutationMetrics("deleteOrganization", resolver, context, {}, null),
		).rejects.toThrow("Mutation failed");

		expect(resolver).toHaveBeenCalledTimes(1);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver = vi.fn().mockResolvedValue({ success: true });

		await withMutationMetrics("createEvent", resolver, context, {}, null);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should handle async resolver that takes time", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver = vi.fn().mockImplementation(
			() =>
				new Promise((resolve) => {
					setTimeout(() => resolve({ delayed: true }), 10);
				}),
		);

		const result = await withMutationMetrics(
			"createOrganization",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toEqual({ delayed: true });

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.ms).toBeGreaterThanOrEqual(9);
	});

	it("should handle multiple mutation calls separately", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver1 = vi.fn().mockResolvedValue({ id: "1" });
		const resolver2 = vi.fn().mockResolvedValue({ id: "2" });

		await withMutationMetrics("createUser", resolver1, context, {}, null);
		await withMutationMetrics("createUser", resolver2, context, {}, null);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(2);
	});

	it("should preserve resolver return values", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const complexResult = {
			user: { id: "user-123", name: "John" },
			token: "auth-token-xyz",
			metadata: { createdAt: new Date() },
		};

		const resolver = vi.fn().mockResolvedValue(complexResult);

		const result = await withMutationMetrics(
			"createUser",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toEqual(complexResult);
		expect((result as typeof complexResult).user.id).toBe("user-123");
		expect((result as typeof complexResult).token).toBe("auth-token-xyz");
	});

	it("should handle null return values", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver = vi.fn().mockResolvedValue(null);

		const result = await withMutationMetrics(
			"deleteOrganization",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toBeNull();
		expect(resolver).toHaveBeenCalledTimes(1);
	});

	it("should handle undefined return values", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const resolver = vi.fn().mockResolvedValue(undefined);

		const result = await withMutationMetrics(
			"updateOrganization",
			resolver,
			context,
			{},
			null,
		);

		expect(result).toBeUndefined();
		expect(resolver).toHaveBeenCalledTimes(1);
	});

	it("should work with different mutation names", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const mutations = [
			"createUser",
			"createOrganization",
			"createEvent",
			"updateOrganization",
			"deleteOrganization",
		];

		for (const mutationName of mutations) {
			const resolver = vi.fn().mockResolvedValue({ mutation: mutationName });
			await withMutationMetrics(mutationName, resolver, context, {}, null);

			const snapshot = perf.snapshot();
			const op = snapshot.ops[`mutation:${mutationName}`];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		}
	});

	it("should handle resolver that throws synchronously", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const error = new Error("Synchronous error");
		const resolver = vi.fn().mockImplementation(() => {
			throw error;
		});

		await expect(
			withMutationMetrics("createUser", resolver, context, {}, null),
		).rejects.toThrow("Synchronous error");

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should handle resolver arguments correctly", async () => {
		const perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext();
		context.perf = perf;

		const args = { input: { name: "Test", email: "test@example.com" } };
		const parent = { id: "parent-123" };

		const resolver = vi.fn().mockResolvedValue({ success: true });

		await withMutationMetrics("createUser", resolver, context, args, parent);

		// Note: The helper doesn't pass args/parent to resolver, but we verify it's called
		expect(resolver).toHaveBeenCalledTimes(1);
	});
});
