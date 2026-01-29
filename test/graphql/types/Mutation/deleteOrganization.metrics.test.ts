import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Mutation deleteOrganization - Performance Tracking", () => {
	// Note: We use direct resolver invocation instead of mercuriusClient integration tests
	// to have precise control over context.perf for performance timing measurements.
	// This allows us to verify exact performance tracker behavior and operation names.
	let deleteOrganizationMutationResolver: (
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
		options: {
			avatarName?: string | null;
			advertisements?: Array<{
				type: string;
				attachments?: Array<{ name: string }>;
			}>;
			chats?: Array<{ avatarName: string | null }>;
			events?: Array<{
				startAt: Date;
				attachments?: Array<{ name: string }>;
			}>;
			posts?: Array<{
				pinnedAt: Date | null;
				attachments?: Array<{ name: string }>;
			}>;
			venues?: Array<{
				updatedAt: Date;
				attachments?: Array<{ name: string }>;
			}>;
		} = {},
	) => {
		const {
			avatarName = null,
			advertisements = [],
			chats = [],
			events = [],
			posts = [],
			venues = [],
		} = options;

		return {
			id: orgId,
			avatarName,
			advertisementsWhereOrganization: advertisements.map((ad) => ({
				type: ad.type,
				attachmentsWhereAdvertisement: ad.attachments || [],
			})),
			chatsWhereOrganization: chats.map((chat) => ({
				avatarName: chat.avatarName,
			})),
			eventsWhereOrganization: events.map((event) => ({
				startAt: event.startAt,
				attachmentsWhereEvent: event.attachments || [],
			})),
			postsWhereOrganization: posts.map((post) => ({
				pinnedAt: post.pinnedAt,
				attachmentsWherePost: post.attachments || [],
			})),
			venuesWhereOrganization: venues.map((venue) => ({
				updatedAt: venue.updatedAt,
				attachmentsWhereVenue: venue.attachments || [],
			})),
		};
	};

	const createMockDeletedOrganization = (orgId: string) => ({
		id: orgId,
		name: "Deleted Organization",
		description: null,
		addressLine1: null,
		addressLine2: null,
		city: null,
		countryCode: null,
		postalCode: null,
		state: null,
		avatarMimeType: null,
		avatarName: null,
		creatorId: "creator-id",
		updaterId: null,
		createdAt: new Date(),
		updatedAt: null,
		userRegistrationRequired: false,
	});

	const createMockTransaction = (
		mockDeletedOrganization: ReturnType<typeof createMockDeletedOrganization>,
	) => {
		return async (callback: (tx: unknown) => Promise<unknown>) => {
			const mockTx = {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockDeletedOrganization]),
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
		const deleteOrganizationField = mutationType.getFields().deleteOrganization;
		if (!deleteOrganizationField) {
			throw new Error("deleteOrganization mutation field not found");
		}
		deleteOrganizationMutationResolver =
			deleteOrganizationField.resolve as typeof deleteOrganizationMutationResolver;
		if (!deleteOrganizationMutationResolver) {
			throw new Error("deleteOrganization mutation resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track mutation execution time on successful deletion", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock existing organization with no related entities
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock deleted organization
			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			// Verify the mutation returned the deleted organization
			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);

			// Verify MinIO removeObjects was not called when there are no objects to remove
			expect(removeObjectsSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:deleteOrganization"];

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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: "", // Invalid empty ID
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
			const op = snapshot.ops["mutation:deleteOrganization"];

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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
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
			const op = snapshot.ops["mutation:deleteOrganization"];

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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
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
			const op = snapshot.ops["mutation:deleteOrganization"];

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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
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
			const op = snapshot.ops["mutation:deleteOrganization"];

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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
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
			const op = snapshot.ops["mutation:deleteOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when deletedOrganization is not returned", async () => {
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
							delete: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([]), // Empty array
								}),
							}),
						};
						return callback(mockTx as never);
					},
				);

			await vi.runAllTimersAsync();
			try {
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
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
			const op = snapshot.ops["mutation:deleteOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on successful deletion with avatar cleanup", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const avatarName = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId, {
				avatarName,
			});
			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);

			// Verify MinIO removeObjects was called with avatar name
			expect(removeObjectsSpy).toHaveBeenCalledWith(
				mocks.minioClient.bucketName,
				expect.arrayContaining([avatarName]),
			);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:deleteOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on successful deletion with cascade cleanup", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();

			// Create organization with various related entities
			const mockExistingOrganization = createMockExistingOrganization(orgId, {
				avatarName: "org-avatar.png",
				advertisements: [
					{
						type: "banner",
						attachments: [
							{ name: "ad-attachment-1.jpg" },
							{ name: "ad-attachment-2.jpg" },
						],
					},
				],
				chats: [
					{ avatarName: "chat-avatar-1.png" },
					{ avatarName: null },
					{ avatarName: "chat-avatar-2.png" },
				],
				events: [
					{
						startAt: new Date(),
						attachments: [{ name: "event-attachment-1.pdf" }],
					},
					{
						startAt: new Date(),
						attachments: [
							{ name: "event-attachment-2.pdf" },
							{ name: "event-attachment-3.pdf" },
						],
					},
				],
				posts: [
					{
						pinnedAt: null,
						attachments: [{ name: "post-attachment-1.jpg" }],
					},
				],
				venues: [
					{
						updatedAt: new Date(),
						attachments: [{ name: "venue-attachment-1.jpg" }],
					},
				],
			});

			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);

			// Verify MinIO removeObjects was called with all object names
			expect(removeObjectsSpy).toHaveBeenCalledWith(
				mocks.minioClient.bucketName,
				expect.arrayContaining([
					"org-avatar.png",
					"ad-attachment-1.jpg",
					"ad-attachment-2.jpg",
					"chat-avatar-1.png",
					"chat-avatar-2.png",
					"event-attachment-1.pdf",
					"event-attachment-2.pdf",
					"event-attachment-3.pdf",
					"post-attachment-1.jpg",
					"venue-attachment-1.jpg",
				]),
			);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:deleteOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on successful deletion with empty related entities", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = perf;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId, {
				avatarName: null,
				advertisements: [],
				chats: [],
				events: [],
				posts: [],
				venues: [],
			});
			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);

			// Verify MinIO removeObjects was not called when there are no objects to remove
			expect(removeObjectsSpy).not.toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:deleteOrganization"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const orgId = faker.string.uuid();

			// Mock administrator user
			const mockAdminUser = createMockAdminUser();

			// Mock existing organization
			const mockExistingOrganization = createMockExistingOrganization(orgId);

			// Mock deleted organization
			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);
			// No objects to remove when organization has no avatar/attachments
			expect(removeObjectsSpy).not.toHaveBeenCalled();
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			await vi.runAllTimersAsync();
			try {
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: "", // Invalid empty ID
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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: faker.string.uuid(),
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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
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
				await deleteOrganizationMutationResolver(
					null,
					{
						input: {
							id: orgId,
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

		it("should handle cascade deletion with cleanup without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			context.perf = undefined;

			const orgId = faker.string.uuid();
			const mockAdminUser = createMockAdminUser();
			const mockExistingOrganization = createMockExistingOrganization(orgId, {
				avatarName: "org-avatar.png",
				advertisements: [
					{
						type: "banner",
						attachments: [{ name: "ad-attachment.jpg" }],
					},
				],
				chats: [{ avatarName: "chat-avatar.png" }],
			});
			const mockDeletedOrganization = createMockDeletedOrganization(orgId);

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
				.mockImplementation(createMockTransaction(mockDeletedOrganization));

			// Mock MinIO removeObjects
			const removeObjectsSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObjects",
			);
			removeObjectsSpy.mockResolvedValue([]);

			const resultPromise = deleteOrganizationMutationResolver(
				null,
				{
					input: {
						id: orgId,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(result).toHaveProperty("id", orgId);
			expect(removeObjectsSpy).toHaveBeenCalledWith(
				mocks.minioClient.bucketName,
				expect.arrayContaining([
					"org-avatar.png",
					"ad-attachment.jpg",
					"chat-avatar.png",
				]),
			);
		});
	});
});
