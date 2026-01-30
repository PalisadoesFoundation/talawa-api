import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

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

		it("should track mutation execution time on duplicate organization name error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgName = `Test Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();

			// Mock existing organization with the same name
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				{
					id: faker.string.uuid(),
					name: orgName,
				},
			);

			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: orgName,
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"forbidden_action_on_arguments_associated_resources",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when currentUser is not found after query", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			// Mock query to return undefined (user not found)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

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

		it("should track mutation execution time when createdOrganization is not returned", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgName = `Test Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			// Mock transaction to return empty array (simulating edge case)
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
									returning: vi.fn().mockResolvedValue([]), // Empty array
								}),
							}),
						};
						return callback(mockTx as never);
					},
				);

			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: orgName,
							description: "Test Description",
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unexpected",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on avatar validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			// Create mock avatar with invalid mime type
			const invalidAvatar = Promise.resolve({
				filename: "avatar.txt",
				mimetype: "text/plain", // Invalid mime type
				createReadStream: vi.fn(),
			});

			await vi.runAllTimersAsync();
			try {
				await createOrganizationMutationResolver(
					null,
					{
						input: {
							name: `Test Org ${faker.string.ulid()}`,
							description: "Test Description",
							avatar: invalidAvatar,
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

		it("should track mutation execution time on successful mutation with avatar upload", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgName = `Test Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockCreatedOrganization = {
				...createMockCreatedOrganization(orgName),
				avatarMimeType: "image/png" as const,
				avatarName: faker.string.uuid(),
			};

			// Create mock avatar with valid mime type
			const validAvatar = Promise.resolve({
				filename: "avatar.png",
				mimetype: "image/png",
				createReadStream: vi.fn().mockReturnValue({
					pipe: vi.fn(),
					on: vi.fn(),
				}),
			});

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			// Mock transaction with avatar fields
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
									returning: vi
										.fn()
										.mockResolvedValue([mockCreatedOrganization]),
								}),
							}),
						};
						return callback(mockTx as never);
					},
				);

			// Mock MinIO client (putObject is already mocked, but we can verify it's called)
			const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
			putObjectSpy.mockResolvedValue({
				etag: "mock-etag",
				versionId: null,
			});

			const resultPromise = createOrganizationMutationResolver(
				null,
				{
					input: {
						name: orgName,
						description: "Test Description",
						avatar: validAvatar,
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
			});

			// Verify MinIO putObject was called for avatar upload
			expect(putObjectSpy).toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when avatar is explicitly set to null", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgName = `Test Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockCreatedOrganization = createMockCreatedOrganization(orgName);

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
						avatar: null, // Explicitly set to null
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
			});

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when avatar upload fails", async () => {
			// Use real timers to avoid infinite loop from runAllTimersAsync (mocks/context can schedule recurring timers)
			vi.useRealTimers();
			try {
				const perf = createPerformanceTracker();
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = perf;

				const orgName = `Test Org ${faker.string.ulid()}`;
				const mockAdminUser = createMockAdminUser();
				const mockCreatedOrganization = {
					...createMockCreatedOrganization(orgName),
					avatarMimeType: "image/png" as const,
					avatarName: faker.string.uuid(),
				};

				// Create mock avatar with valid mime type
				const validAvatar = Promise.resolve({
					filename: "avatar.png",
					mimetype: "image/png",
					createReadStream: vi.fn().mockReturnValue({
						pipe: vi.fn(),
						on: vi.fn(),
					}),
				});

				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					mockAdminUser,
				);
				mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
					undefined,
				);

				// Mock transaction with avatar fields
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
										returning: vi
											.fn()
											.mockResolvedValue([mockCreatedOrganization]),
									}),
								}),
							};
							return callback(mockTx as never);
						},
					);

				// Mock MinIO putObject to fail
				const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
				putObjectSpy.mockRejectedValue(new Error("Avatar upload failed"));

				try {
					await createOrganizationMutationResolver(
						null,
						{
							input: {
								name: orgName,
								description: "Test Description",
								avatar: validAvatar,
							},
						},
						context,
					);
					expect.fail("Expected error to be thrown");
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toContain("Avatar upload failed");
				}

				// Verify performance tracker recorded the failure path
				const snapshot = perf.snapshot();
				const op = snapshot.ops["mutation:createOrganization"];

				expect(op).toBeDefined();
				expect(op?.count).toBe(1);
				expect(op?.ms).toBeGreaterThanOrEqual(0);
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should track mutation execution time with different valid avatar mime types", async () => {
			const validMimeTypes = [
				"image/jpeg",
				"image/webp",
				"image/avif",
			] as const;

			for (const mimeType of validMimeTypes) {
				const perf = createPerformanceTracker();
				const { context, mocks } = createMockGraphQLContext(true, "admin-user");
				context.perf = perf;

				const orgName = `Test Org ${faker.string.ulid()}`;
				const mockAdminUser = createMockAdminUser();
				const mockCreatedOrganization = {
					...createMockCreatedOrganization(orgName),
					avatarMimeType: mimeType,
					avatarName: faker.string.uuid(),
				};

				const validAvatar = Promise.resolve({
					filename: `avatar.${mimeType.split("/")[1]}`,
					mimetype: mimeType,
					createReadStream: vi.fn().mockReturnValue({
						pipe: vi.fn(),
						on: vi.fn(),
					}),
				});

				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					mockAdminUser,
				);
				mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
					undefined,
				);

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
										returning: vi
											.fn()
											.mockResolvedValue([mockCreatedOrganization]),
									}),
								}),
							};
							return callback(mockTx as never);
						},
					);

				const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
				putObjectSpy.mockResolvedValue({
					etag: "mock-etag",
					versionId: null,
				});

				const resultPromise = createOrganizationMutationResolver(
					null,
					{
						input: {
							name: orgName,
							description: "Test Description",
							avatar: validAvatar,
						},
					},
					context,
				);
				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result).toBeDefined();
				expect(putObjectSpy).toHaveBeenCalled();

				const snapshot = perf.snapshot();
				const op = snapshot.ops["mutation:createOrganization"];

				expect(op).toBeDefined();
				expect(op?.count).toBe(1);
				expect(op?.ms).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			// Use real timers for this test to avoid infinite loop from runAllTimersAsync
			// (mocks/context can schedule recurring timers)
			vi.useRealTimers();
			try {
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

				const result = await createOrganizationMutationResolver(
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

				expect(result).toBeDefined();
				expect(result).toMatchObject({
					name: orgName,
					description: "Test Description",
					userRegistrationRequired: false,
				});
			} finally {
				vi.useFakeTimers();
			}
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			// Validation error happens synchronously - no timer advancement needed
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

			// Authentication error happens synchronously - no timer advancement needed
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

		it("should handle authorization error without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "regular-user");
			context.perf = undefined;

			// Mock non-admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "regular-user",
				role: "regular" as const,
			});

			// Resolver throws immediately for unauthorized; no timer advancement needed
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
		});
	});

	describe("mercuriusClient smoke test for schema wiring", () => {
		beforeEach(() => {
			vi.useRealTimers();
		});
		afterEach(() => {
			vi.useFakeTimers();
		});

		it("should execute createOrganization mutation through mercuriusClient with schema wiring", async () => {
			// Sign in as admin to get authentication token
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			expect(signInResult.errors).toBeUndefined();
			expect(signInResult.data?.signIn?.authenticationToken).toBeDefined();
			const authToken = signInResult.data?.signIn?.authenticationToken;

			// Execute createOrganization mutation through mercuriusClient
			const orgName = `Smoke Test Org ${faker.string.ulid()}`;
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: orgName,
						description: "Smoke test description",
					},
				},
			});

			// Verify schema wiring works (mutation executes successfully)
			expect(result.errors).toBeUndefined();
			expect(result.data?.createOrganization).toBeDefined();
			expect(result.data?.createOrganization?.name).toBe(orgName);

			// Cleanup: Delete the created organization
			const orgId = result.data?.createOrganization?.id;
			if (orgId) {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: orgId,
						},
					},
				});
			}

			// Note: Performance tracking verification is done in the direct resolver tests above
			// This smoke test only verifies that the schema wiring is correct and the mutation
			// can be executed through the full GraphQL execution pipeline.
		});
	});
});
