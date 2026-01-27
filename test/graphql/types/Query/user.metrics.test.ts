import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { uuidv7 } from "uuidv7";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Query user - Performance Tracking", () => {
	let userQueryResolver: (
		_parent: unknown,
		args: { input: { id: string } },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	beforeEach(() => {
		vi.useFakeTimers();
		const userQueryType = schema.getType("Query") as GraphQLObjectType;
		const userField = userQueryType.getFields().user;
		if (!userField) {
			throw new Error("User query field not found");
		}
		userQueryResolver = userField.resolve as typeof userQueryResolver;
		if (!userQueryResolver) {
			throw new Error("User query resolver not found");
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

			const userId = uuidv7();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 10);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockUser);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

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
				userQueryResolver(null, { input: { id: "invalid-id" } }, context),
			).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			// Validation happens synchronously, so time may be 0ms, but metrics are still collected
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on resource not found error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const userId = uuidv7();

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track multiple query executions separately", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const userId1 = uuidv7();
			const userId2 = uuidv7();
			const mockUser1 = { id: userId1, name: "User 1" };
			const mockUser2 = { id: userId2, name: "User 2" };

			mocks.drizzleClient.query.usersTable.findFirst
				.mockImplementationOnce(
					() =>
						new Promise((resolve) => {
							setTimeout(() => resolve(mockUser1), 0);
						}),
				)
				.mockImplementationOnce(
					() =>
						new Promise((resolve) => {
							setTimeout(() => resolve(mockUser2), 0);
						}),
				);

			const promise1 = userQueryResolver(
				null,
				{ input: { id: userId1 } },
				context,
			);
			const promise2 = userQueryResolver(
				null,
				{ input: { id: userId2 } },
				context,
			);
			await vi.runAllTimersAsync();
			await promise1;
			await promise2;

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(2);
		});
	});

	describe("when performance tracker is unavailable", () => {
		it("should execute query successfully without tracking (undefined)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			// Explicitly ensure perf is undefined
			context.perf = undefined;

			const userId = uuidv7();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 0);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should execute query successfully without tracking (null)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			// Test null edge case (runtime could have null even if TypeScript says it can't)
			context.perf = null as unknown as typeof context.perf;

			const userId = uuidv7();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 0);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should handle errors gracefully when perf tracker is unavailable", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const userId = uuidv7();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				userQueryResolver(null, { input: { id: userId } }, context),
			).rejects.toThrow();
		});
	});

	describe("query functionality preservation", () => {
		it("should preserve existing query behavior with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const userId = uuidv7();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 0);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should preserve existing query behavior without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const userId = uuidv7();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 0);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: userId } },
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});
	});
});
