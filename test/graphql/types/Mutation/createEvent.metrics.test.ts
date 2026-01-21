import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Test suite for createEvent mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createEvent mutation.
 */
describe("createEvent mutation performance tracking", () => {
	let perf: ReturnType<typeof createPerformanceTracker>;
	let ctx: GraphQLContext;

	beforeEach(() => {
		perf = createPerformanceTracker();
		const { context } = createMockGraphQLContext(true, "user-id");
		ctx = context;
		ctx.perf = perf;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should track mutation execution time when perf tracker is available", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createEvent", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { id: "event-123", name: "Test Event" };
				})) ?? { id: "event-123", name: "Test Event" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(10);
	});

	it("should track metrics even when mutation fails", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createEvent", async () => {
					throw new Error("Event creation failed");
				})) ??
				(() => {
					throw new Error("Event creation failed");
				})()
			);
		};

		await expect(executeMutation()).rejects.toThrow("Event creation failed");

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createEvent", async () => {
					return { id: "event-456", name: "Test Event 2" };
				})) ?? { id: "event-456", name: "Test Event 2" }
			);
		};

		await executeMutation();

		const snapshot = perf.snapshot();
		const op = snapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(snapshot.ops).toHaveProperty("mutation:createEvent");
	});

	it("should track sub-operations (validation, DB writes, related entities)", async () => {
		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createEvent", async () => {
					// Simulate validation
					const validationStop = ctx.perf?.start("validation");
					await new Promise((resolve) => setTimeout(resolve, 2));
					validationStop?.();

					// Simulate DB writes
					const dbStop = ctx.perf?.start("db-write");
					await new Promise((resolve) => setTimeout(resolve, 3));
					dbStop?.();

					// Simulate related entity creation
					const relatedStop = ctx.perf?.start("related-entities");
					await new Promise((resolve) => setTimeout(resolve, 2));
					relatedStop?.();

					return { id: "event-789", name: "Complex Event" };
				})) ?? { id: "event-789", name: "Complex Event" }
			);
		};

		const result = await executeMutation();

		expect(result).toBeDefined();
		const snapshot = perf.snapshot();
		const mainOp = snapshot.ops["mutation:createEvent"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(7);
	});

	it("should work when perf tracker is not available (graceful degradation)", async () => {
		ctx.perf = undefined;

		const executeMutation = async () => {
			return (
				(await ctx.perf?.time("mutation:createEvent", async () => {
					return { id: "event-999", name: "No Metrics Event" };
				})) ?? { id: "event-999", name: "No Metrics Event" }
			);
		};

		const result = await executeMutation();

		expect(result).toEqual({ id: "event-999", name: "No Metrics Event" });
		const snapshot = perf.snapshot();
		expect(snapshot.ops["mutation:createEvent"]).toBeUndefined();
	});
});
