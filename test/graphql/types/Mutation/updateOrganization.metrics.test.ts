import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Mutation updateOrganization - Performance Tracking", () => {
	// Note: We use direct resolver invocation instead of mercuriusClient integration tests
	// to have precise control over context.perf for performance timing measurements.
	// This allows us to verify exact performance tracker behavior and operation names.
	let updateOrganizationMutationResolver: (
		_parent: unknown,
		args: { input: Record<string, unknown> },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	// Shared fixtures to reduce duplication
	const createMockAdminUser = () => ({
		id: "admin-user",
		role: "administrator" as const,
	});

	const createMockExistingOrganization = (
		orgId: string,
		avatarName: string | null = null,
	) => ({
		id: orgId,
		avatarName,
	});

	const createMockUpdatedOrganization = (
		orgId: string,
		orgName: string,
		updaterId = "admin-user",
		options?: {
			avatarMimeType?: string | null;
			avatarName?: string | null;
		},
	) => ({
		id: orgId,
		name: orgName,
		description: "Updated Description",
		addressLine1: null,
		addressLine2: null,
		city: null,
		countryCode: null,
		postalCode: null,
		state: null,
		avatarMimeType: options?.avatarMimeType ?? null,
		avatarName: options?.avatarName ?? null,
		creatorId: "creator-id",
		updaterId,
		createdAt: new Date(),
		updatedAt: new Date(),
		userRegistrationRequired: false,
	});

	const createMockTransaction = (
		mockUpdatedOrganization: ReturnType<typeof createMockUpdatedOrganization>,
	) => {
		return async (callback: (tx: unknown) => Promise<unknown>) => {
			const mockTx = {
				update: vi.fn().mockReturnValue({
					set: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([mockUpdatedOrganization]),
						}),
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
		const updateOrganizationField = mutationType.getFields().updateOrganization;
		if (!updateOrganizationField) {
			throw new Error("updateOrganization mutation field not found");
		}
		updateOrganizationMutationResolver =
			updateOrganizationField.resolve as typeof updateOrganizationMutationResolver;
		if (!updateOrganizationMutationResolver) {
			throw new Error("updateOrganization mutation resolver not found");
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

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock existing organization
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock updated organization
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						description: "Updated Description",
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			// Verify the mutation returned the updated organization with correct data
			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
				description: "Updated Description",
			});
			expect(result).toHaveProperty("updaterId", "admin-user");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

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
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: "", // Invalid empty name
							description: "Updated Description",
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
			const op = snapshot.ops["mutation:updateOrganization"];

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
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: `Updated Org ${faker.string.ulid()}`,
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
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on authorization error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "regular-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock non-admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "regular-user",
				role: "regular" as const,
			});
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: `Updated Org ${faker.string.ulid()}`,
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
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on duplicate organization name error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock existing organization with the same name (different ID)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst
				.mockResolvedValueOnce(mockExistingOrganization) // First call: existing org to update
				.mockResolvedValueOnce({
					// Second call: duplicate name check
					id: faker.string.uuid(), // Different ID
					name: orgName,
				});

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: orgName,
							description: "Updated Description",
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
			const op = snapshot.ops["mutation:updateOrganization"];

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
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: `Updated Org ${faker.string.ulid()}`,
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
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when existingOrganization is not found", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined, // Organization not found
			);

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: `Updated Org ${faker.string.ulid()}`,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"arguments_associated_resources_not_found",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when updatedOrganization is not returned", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
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
							update: vi.fn().mockReturnValue({
								set: vi.fn().mockReturnValue({
									where: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]), // Empty array
									}),
								}),
							}),
						};
						return callback(mockTx as never);
					},
				);

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: `Updated Org ${faker.string.ulid()}`,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"arguments_associated_resources_not_found",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

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
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: `Updated Org ${faker.string.ulid()}`,
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
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on successful mutation with avatar upload", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(
				orgId,
				null,
			); // No existing avatar
			const avatarName = faker.string.uuid();
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
				"admin-user",
				{
					avatarMimeType: "image/png",
					avatarName,
				},
			);

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
				mockExistingOrganization,
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
							update: vi.fn().mockReturnValue({
								set: vi.fn().mockReturnValue({
									where: vi.fn().mockReturnValue({
										returning: vi
											.fn()
											.mockResolvedValue([mockUpdatedOrganization]),
									}),
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

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						description: "Updated Description",
						avatar: validAvatar,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
				description: "Updated Description",
			});

			// Verify MinIO putObject was called for avatar upload
			expect(putObjectSpy).toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when avatar is explicitly set to null", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const existingAvatarName = faker.string.uuid();
			const mockExistingOrganization = createMockExistingOrganization(
				orgId,
				existingAvatarName,
			);
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			// Mock MinIO removeObject
			const removeObjectSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObject",
			);
			removeObjectSpy.mockResolvedValue(undefined);

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						description: "Updated Description",
						avatar: null, // Explicitly set to null
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
				description: "Updated Description",
			});

			// Verify MinIO removeObject was called to delete existing avatar
			expect(removeObjectSpy).toHaveBeenCalledWith(
				mocks.minioClient.bucketName,
				existingAvatarName,
			);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when name is undefined (no duplicate check)", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				"Existing Name",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						// name is undefined - should skip duplicate check
						description: "Updated Description",
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				description: "Updated Description",
			});

			// Verify duplicate name check was NOT called (name is undefined)
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1); // Only the initial query, not duplicate check

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when avatar is set to null but existingOrganization has no avatar", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(
				orgId,
				null,
			); // No existing avatar
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			// Mock MinIO removeObject - should NOT be called
			const removeObjectSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObject",
			);
			removeObjectSpy.mockResolvedValue(undefined);

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						avatar: null, // Set to null, but no existing avatar to remove
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
			});

			// Verify MinIO removeObject was NOT called (no existing avatar to remove)
			expect(removeObjectSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when avatar is undefined (not provided)", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId);
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			// Mock MinIO operations - should NOT be called
			const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
			const removeObjectSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObject",
			);

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						// avatar is undefined (not provided)
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
			});

			// Verify MinIO operations were NOT called (avatar not provided)
			expect(putObjectSpy).not.toHaveBeenCalled();
			expect(removeObjectSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when updating existing avatar", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;
			const existingAvatarName = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(
				orgId,
				existingAvatarName,
			);
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
				"admin-user",
				{
					avatarMimeType: "image/jpeg",
					avatarName: existingAvatarName, // Same avatar name (reusing)
				},
			);

			// Create mock avatar with valid mime type
			const validAvatar = Promise.resolve({
				filename: "avatar.jpg",
				mimetype: "image/jpeg",
				createReadStream: vi.fn().mockReturnValue({
					pipe: vi.fn(),
					on: vi.fn(),
				}),
			});

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			// Mock MinIO client
			const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
			putObjectSpy.mockResolvedValue({
				etag: "mock-etag",
				versionId: null,
			});

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
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
			const op = snapshot.ops["mutation:updateOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
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

				const orgId = faker.string.uuid();
				const orgName = `Updated Org ${faker.string.ulid()}`;
				const mockAdminUser = createMockAdminUser();
				const mockExistingOrganization = createMockExistingOrganization(orgId);
				const avatarName = faker.string.uuid();
				const mockUpdatedOrganization = createMockUpdatedOrganization(
					orgId,
					orgName,
					"admin-user",
					{
						avatarMimeType: mimeType,
						avatarName,
					},
				);

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
					mockExistingOrganization,
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
								update: vi.fn().mockReturnValue({
									set: vi.fn().mockReturnValue({
										where: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockUpdatedOrganization]),
										}),
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

				const resultPromise = updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: orgName,
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
				const op = snapshot.ops["mutation:updateOrganization"];

				expect(op).toBeDefined();
				expect(op?.count).toBe(1);
				expect(op?.ms).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const orgId = faker.string.uuid();
			const orgName = `Updated Org ${faker.string.ulid()}`;

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock existing organization
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock updated organization
			const mockUpdatedOrganization = createMockUpdatedOrganization(
				orgId,
				orgName,
			);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(createMockTransaction(mockUpdatedOrganization));

			const resultPromise = updateOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
						name: orgName,
						description: "Updated Description",
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toMatchObject({
				id: orgId,
				name: orgName,
				description: "Updated Description",
			});
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: "", // Invalid empty name
							description: "Updated Description",
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
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
							name: `Updated Org ${faker.string.ulid()}`,
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

			const orgId = faker.string.uuid();
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock non-admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "regular-user",
				role: "regular" as const,
			});
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockExistingOrganization,
			);

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: `Updated Org ${faker.string.ulid()}`,
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

		it("should handle organization not found error without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockAdminUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined, // Organization not found
			);

			await vi.runAllTimersAsync();
			try {
				await updateOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
							name: `Updated Org ${faker.string.ulid()}`,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"arguments_associated_resources_not_found",
				);
			}
		});
	});
});
