import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { ulid } from "ulidx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Query organization - Performance Tracking", () => {
	let organizationQueryResolver: (
		_parent: unknown,
		args: { input: { id: string } },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	beforeEach(() => {
		vi.useFakeTimers();
		const organizationQueryType = schema.getType("Query") as GraphQLObjectType;
		const organizationField = organizationQueryType.getFields().organization;
		if (!organizationField) {
			throw new Error("Organization query field not found");
		}
		organizationQueryResolver =
			organizationField.resolve as typeof organizationQueryResolver;
		if (!organizationQueryResolver) {
			throw new Error("Organization query resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track query execution time on successful query", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const orgId = ulid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(10);
					return mockOrganization;
				},
			);

			const result = await organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);

			expect(result).toEqual(mockOrganization);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			// Validation error happens synchronously during parsing
			// The perf tracker still measures the time, even if it's very short
			await expect(
				organizationQueryResolver(
					null,
					{ input: { id: "invalid-id" } },
					context,
				),
			).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			// Validation happens synchronously, so time may be 0ms, but metrics are still collected
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on resource not found error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const orgId = ulid();

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(5);
					return undefined;
				},
			);

			await expect(
				organizationQueryResolver(null, { input: { id: orgId } }, context),
			).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track multiple query executions separately", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const orgId1 = ulid();
			const orgId2 = ulid();
			const mockOrg1 = { id: orgId1, name: "Org 1" };
			const mockOrg2 = { id: orgId2, name: "Org 2" };

			mocks.drizzleClient.query.organizationsTable.findFirst
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return mockOrg1;
				})
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return mockOrg2;
				});

			await organizationQueryResolver(null, { input: { id: orgId1 } }, context);
			await organizationQueryResolver(null, { input: { id: orgId2 } }, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(2);
		});
	});

	describe("when performance tracker is unavailable", () => {
		it("should execute query successfully without tracking (undefined)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const orgId = ulid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);

			expect(result).toEqual(mockOrganization);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should execute query successfully without tracking (null)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			// Test null edge case (runtime could have null even if TypeScript says it can't)
			context.perf = null as unknown as typeof context.perf;

			const orgId = ulid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);

			expect(result).toEqual(mockOrganization);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should handle errors gracefully when perf tracker is unavailable", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const orgId = ulid();

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				organizationQueryResolver(null, { input: { id: orgId } }, context),
			).rejects.toThrow();
		});
	});

	describe("query functionality preservation", () => {
		it("should preserve existing query behavior with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const orgId = ulid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);

			expect(result).toEqual(mockOrganization);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should preserve existing query behavior without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const orgId = ulid();
			const mockOrganization = {
				id: orgId,
				name: "Test Organization",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await organizationQueryResolver(
				null,
				{ input: { id: orgId } },
				context,
			);

			expect(result).toEqual(mockOrganization);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});
	});
});
