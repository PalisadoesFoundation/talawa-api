import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Mutation createOrganization - Performance Tracking", () => {
	// Note: We use direct resolver invocation instead of mercuriusClient integration tests
	// to have precise control over context.perf for performance timing measurements.
	// This allows us to verify exact performance tracker behavior and operation names.
	let createOrganizationMutationResolver: (
		_parent: unknown,
		args: { input: Record<string, unknown> },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	// Shared fixtures to reduce duplication
	const createMockAdminUser = () => ({
		id: "admin-user",
		role: "administrator" as const,
	});

	const createMockCreatedOrganization = (
		orgName: string,
		creatorId = "admin-user",
	) => ({
		id: faker.string.uuid(),
		name: orgName,
		description: "Test Description",
		addressLine1: null,
		addressLine2: null,
		city: null,
		countryCode: null,
		postalCode: null,
		state: null,
		avatarMimeType: null,
		avatarName: null,
		creatorId,
		updaterId: null,
		createdAt: new Date(),
		updatedAt: null,
		userRegistrationRequired: false,
	});

	const createMockTransaction = (
		mockCreatedOrganization: ReturnType<typeof createMockCreatedOrganization>,
	) => {
		return async (callback: (tx: unknown) => Promise<unknown>) => {
			const mockTx = {
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockCreatedOrganization]),
					}),
				}),
			};
			return callback(mockTx as never);
		};
	};

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		const mutationType = schema.getType("Mutation") as GraphQLObjectType;
		const createOrganizationField = mutationType.getFields().createOrganization;
		if (!createOrganizationField) {
			throw new Error("createOrganization mutation field not found");
		}
		createOrganizationMutationResolver =
			createOrganizationField.resolve as typeof createOrganizationMutationResolver;
		if (!createOrganizationMutationResolver) {
			throw new Error("createOrganization mutation resolver not found");
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

			const orgName = `Test Org ${faker.string.ulid()}`;

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock organization creation
			const mockCreatedOrganization = createMockCreatedOrganization(orgName);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined,
			); // No existing organization

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockCreatedOrganization));

			const resultPromise = createOrganizationMutationResolver(
				null,
				{
					input: {
						name: orgName,
						description: "Test Description",
						isUserRegistrationRequired: false,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			// Verify the mutation returned the created organization with correct data
			expect(result).toBeDefined();
			expect(result).toMatchObject({
				name: orgName,
				description: "Test Description",
				userRegistrationRequired: false,
			});
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("creatorId", "admin-user");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			// Invalid input triggers validation error
			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: "", // Invalid empty name
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"invalid_arguments",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on authentication error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(false); // Unauthenticated
			context.perf = perf;

			await vi.runAllTimersAsync();

			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: `Test Org ${faker.string.ulid()}`,
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthenticated",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

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

			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: `Test Org ${faker.string.ulid()}`,
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthorized_action",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const orgName = `Test Org ${faker.string.ulid()}`;

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock organization creation
			const mockCreatedOrganization = createMockCreatedOrganization(orgName);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockCreatedOrganization));

			const resultPromise = createOrganizationMutationResolver(
				null,
				{
					input: {
						name: orgName,
						description: "Test Description",
						isUserRegistrationRequired: false,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				name: orgName,
				description: "Test Description",
				userRegistrationRequired: false,
			});
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: "", // Invalid empty name
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"invalid_arguments",
				);
			}
		});

		it("should handle authentication error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(false); // Unauthenticated
			context.perf = undefined;

			await vi.runAllTimersAsync();

			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: `Test Org ${faker.string.ulid()}`,
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthenticated",
				);
			}
		});
	});
});
