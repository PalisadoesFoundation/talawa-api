import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { ulid } from "ulidx";
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
		vi.clearAllMocks();
		const queryType = schema.getType("Query") as GraphQLObjectType;
		const userField = queryType.getFields().user;
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

			const userId = ulid();
			const mockUser = {
				id: userId,
				name: "Test User",
				emailAddress: "test@example.com",
				role: "regular" as const,
				isEmailAddressVerified: true,
				avatarMimeType: null,
				avatarName: null,
				creatorId: null,
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				passwordHash: "hashedpassword",
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

			// Empty ID triggers validation error
			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					userQueryResolver(null, { input: { id: "" } }, context),
				).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on not-found error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: ulid() } },
				context,
			);

			await expect(async () => {
				await vi.runAllTimersAsync();
				await resultPromise;
			}).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:user"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute query successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const userId = ulid();
			const mockUser = {
				id: userId,
				name: "Test User No Perf",
				emailAddress: "test@example.com",
				role: "regular" as const,
				isEmailAddressVerified: true,
				avatarMimeType: null,
				avatarName: null,
				creatorId: null,
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				passwordHash: "hashedpassword",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockUser), 5);
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
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					userQueryResolver(null, { input: { id: "" } }, context),
				).rejects.toThrow(),
			]);
		});

		it("should handle not-found error without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 5);
					}),
			);

			const resultPromise = userQueryResolver(
				null,
				{ input: { id: ulid() } },
				context,
			);

			await expect(async () => {
				await vi.runAllTimersAsync();
				await resultPromise;
			}).rejects.toThrow();
		});
	});
});
