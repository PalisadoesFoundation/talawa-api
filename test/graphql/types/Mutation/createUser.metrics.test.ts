import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Mutation createUser - Performance Tracking", () => {
	// Note: We use direct resolver invocation instead of mercuriusClient integration tests
	// to have precise control over context.perf for performance timing measurements.
	// This allows us to verify exact performance tracker behavior and operation names.
	let createUserMutationResolver: (
		_parent: unknown,
		args: { input: Record<string, unknown> },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	// Helper factories to reduce duplication
	const createMockAdminUser = () => ({
		id: "admin-user",
		role: "administrator" as const,
	});

	const createMockCreatedUser = (
		emailAddress: string,
		creatorId = "admin-user",
	) => ({
		id: faker.string.uuid(),
		name: "Test User",
		emailAddress,
		role: "regular" as const,
		isEmailAddressVerified: false,
		avatarMimeType: null,
		avatarName: null,
		creatorId,
		updaterId: null,
		createdAt: new Date(),
		updatedAt: null,
		passwordHash: "hashedpassword",
	});

	const setupSuccessMocks = (
		mocks: ReturnType<typeof createMockGraphQLContext>["mocks"],
		mockAdminUser: ReturnType<typeof createMockAdminUser>,
		mockCreatedUser: ReturnType<typeof createMockCreatedUser>,
	) => {
		// Mock database queries
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockAdminUser) // Current user check
			.mockResolvedValueOnce(undefined); // Existing user check

		// Mock transaction
		(
			mocks.drizzleClient as unknown as {
				transaction: ReturnType<typeof vi.fn>;
			}
		).transaction = vi
			.fn()
			.mockImplementation(
				async (callback: (tx: unknown) => Promise<unknown>) => {
					const mockTx = {
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([mockCreatedUser]),
							}),
						}),
					};
					return callback(mockTx as never);
				},
			);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		const mutationType = schema.getType("Mutation") as GraphQLObjectType;
		const createUserField = mutationType.getFields().createUser;
		if (!createUserField) {
			throw new Error("createUser mutation field not found");
		}
		createUserMutationResolver =
			createUserField.resolve as typeof createUserMutationResolver;
		if (!createUserMutationResolver) {
			throw new Error("createUser mutation resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track mutation execution time on successful mutation", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const emailAddress = `test${faker.string.ulid()}@example.com`;
			const mockAdminUser = createMockAdminUser();
			const mockCreatedUser = createMockCreatedUser(emailAddress);

			setupSuccessMocks(mocks, mockAdminUser, mockCreatedUser);

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress,
						name: "Test User",
						password: "password123",
						role: "regular",
						isEmailAddressVerified: false,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			// Invalid input triggers validation error
			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress: "", // Invalid empty email
						name: "Test User",
						password: "password123",
						role: "regular",
					},
				},
				context,
			);

			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow(/invalid_arguments/i);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on authentication error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(false); // Unauthenticated
			context.perf = perf;

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress: `test${faker.string.ulid()}@example.com`,
						name: "Test User",
						password: "password123",
						role: "regular",
					},
				},
				context,
			);

			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow(/unauthenticated/i);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on authorization error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "regular-user");
			context.perf = perf;

			// Mock non-admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "regular-user",
				role: "regular" as const,
			});

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress: `test${faker.string.ulid()}@example.com`,
						name: "Test User",
						password: "password123",
						role: "regular",
					},
				},
				context,
			);

			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow(/unauthorized_action/i);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createUser"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const emailAddress = `test${faker.string.ulid()}@example.com`;
			const mockAdminUser = createMockAdminUser();
			const mockCreatedUser = createMockCreatedUser(emailAddress);

			setupSuccessMocks(mocks, mockAdminUser, mockCreatedUser);

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress,
						name: "Test User",
						password: "password123",
						role: "regular",
						isEmailAddressVerified: false,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress: "", // Invalid empty email
						name: "Test User",
						password: "password123",
						role: "regular",
					},
				},
				context,
			);

			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow(/invalid_arguments/i);
		});

		it("should handle authentication error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(false); // Unauthenticated
			context.perf = undefined;

			const resultPromise = createUserMutationResolver(
				null,
				{
					input: {
						emailAddress: `test${faker.string.ulid()}@example.com`,
						name: "Test User",
						password: "password123",
						role: "regular",
					},
				},
				context,
			);

			await vi.runAllTimersAsync();
			await expect(resultPromise).rejects.toThrow(/unauthenticated/i);
		});
	});
});
