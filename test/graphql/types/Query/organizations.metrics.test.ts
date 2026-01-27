import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { ulid } from "ulidx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Query organizations - Performance Tracking", () => {
	let organizationsQueryResolver: (
		_parent: unknown,
		args: {
			filter?: string | null;
			limit?: number | null;
			offset?: number | null;
		},
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown[]>;

	beforeEach(() => {
		vi.useFakeTimers();
		const organizationsQueryType = schema.getType("Query") as GraphQLObjectType;
		const organizationsField = organizationsQueryType.getFields().organizations;
		if (!organizationsField) {
			throw new Error("Organizations query field not found");
		}
		organizationsQueryResolver =
			organizationsField.resolve as typeof organizationsQueryResolver;
		if (!organizationsQueryResolver) {
			throw new Error("Organizations query resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track query execution time on successful query (administrator)", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrganizations = [
				{ id: ulid(), name: "Org 1" },
				{ id: ulid(), name: "Org 2" },
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "administrator" }), 5);
					}),
			);
			mocks.drizzleClient.query.organizationsTable.findMany.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockOrganizations), 5);
					}),
			);

			const resultPromise = organizationsQueryResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(10);
			const result = await resultPromise;

			expect(result).toEqual(mockOrganizations);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time on successful query (regular user)", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrganizations = [{ id: ulid(), name: "Org 1" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "regular" }), 3);
					}),
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve([]), 3);
					}),
			);
			mocks.drizzleClient.query.organizationsTable.findMany.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockOrganizations), 4);
					}),
			);

			const resultPromise = organizationsQueryResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(10);
			const result = await resultPromise;

			expect(result).toEqual(mockOrganizations);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time on unauthenticated error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = organizationsQueryResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(5);
			await expect(resultPromise).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track query execution time even when database query throws", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => reject(new Error("Database error")), 5);
					}),
			);

			const resultPromise = organizationsQueryResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(5);
			await expect(resultPromise).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track query execution time with filtering", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrganizations = [{ id: ulid(), name: "Filtered Org" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(5);
					return { role: "administrator" };
				},
			);
			mocks.drizzleClient.query.organizationsTable.findMany.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(5);
					return mockOrganizations;
				},
			);

			const result = await organizationsQueryResolver(
				null,
				{ filter: "Filtered" },
				context,
			);

			expect(result).toEqual(mockOrganizations);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should track query execution time with pagination", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrganizations = [{ id: ulid(), name: "Org 1" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(5);
					return { role: "administrator" };
				},
			);
			mocks.drizzleClient.query.organizationsTable.findMany.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(5);
					return mockOrganizations;
				},
			);

			const result = await organizationsQueryResolver(
				null,
				{ limit: 10, offset: 0 },
				context,
			);

			expect(result).toEqual(mockOrganizations);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should track multiple query executions separately", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrgs1 = [{ id: ulid(), name: "Org 1" }];
			const mockOrgs2 = [{ id: ulid(), name: "Org 2" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return { role: "administrator" };
				},
			);
			mocks.drizzleClient.query.organizationsTable.findMany
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return mockOrgs1;
				})
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return mockOrgs2;
				});

			await organizationsQueryResolver(null, {}, context);
			await organizationsQueryResolver(null, {}, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(2);
		});
	});

	describe("when performance tracker is unavailable", () => {
		it("should execute query successfully without tracking", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const mockOrganizations = [
				{ id: ulid(), name: "Org 1" },
				{ id: ulid(), name: "Org 2" },
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
				mockOrganizations,
			);

			const result = await organizationsQueryResolver(null, {}, context);

			expect(result).toEqual(mockOrganizations);
			expect(
				mocks.drizzleClient.query.organizationsTable.findMany,
			).toHaveBeenCalledTimes(1);
		});

		it("should handle errors gracefully when perf tracker is unavailable", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				organizationsQueryResolver(null, {}, context),
			).rejects.toThrow();
		});
	});

	describe("query functionality preservation", () => {
		it("should preserve existing query behavior with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const mockOrganizations = [{ id: ulid(), name: "Test Org" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
				mockOrganizations,
			);

			const result = await organizationsQueryResolver(null, {}, context);

			expect(result).toEqual(mockOrganizations);
			expect(
				mocks.drizzleClient.query.organizationsTable.findMany,
			).toHaveBeenCalled();
		});

		it("should preserve existing query behavior without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const mockOrganizations = [{ id: ulid(), name: "Test Org" }];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
				mockOrganizations,
			);

			const result = await organizationsQueryResolver(null, {}, context);

			expect(result).toEqual(mockOrganizations);
			expect(
				mocks.drizzleClient.query.organizationsTable.findMany,
			).toHaveBeenCalled();
		});
	});
});
