import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	agendaCategoriesTable,
	agendaFoldersTable,
} from "~/src/drizzle/schema";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { schema } from "~/src/graphql/schema";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Mutation createEvent - Performance Tracking", () => {
	// Note: We use direct resolver invocation instead of mercuriusClient integration tests
	// to have precise control over context.perf for performance timing measurements.
	// This allows us to verify exact performance tracker behavior and operation names.
	let createEventMutationResolver: (
		_parent: unknown,
		args: { input: Record<string, unknown> },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	// Helper factories to reduce duplication
	const createMockUser = (
		userId: string,
		role: "regular" | "administrator" = "regular",
	) => ({
		id: userId,
		role,
		name: "Test User",
	});

	const createMockOrganization = (organizationId: string) => ({
		id: organizationId,
		name: "Test Organization",
		countryCode: "US",
		membershipsWhereOrganization: [
			{
				role: "admin" as const,
			},
		],
	});

	const createMockEvent = (
		organizationId: string,
		startAt: Date,
		endAt: Date,
		userId = "user-123",
	) => ({
		id: faker.string.uuid(),
		name: "Test Event",
		description: "Test Description",
		organizationId,
		creatorId: userId,
		startAt,
		endAt,
		allDay: false,
		isPublic: false,
		isRegisterable: false,
		isInviteOnly: false,
		location: null,
		isRecurringEventTemplate: false,
		createdAt: new Date(),
		updatedAt: null,
	});

	const createMockAgendaFolder = (
		eventId: string,
		organizationId: string,
		userId = "user-123",
	) => ({
		id: faker.string.uuid(),
		name: "Default",
		description: "Default agenda folder",
		eventId,
		organizationId,
		isDefaultFolder: true,
		sequence: 1,
		creatorId: userId,
	});

	const createMockAgendaCategory = (
		eventId: string,
		organizationId: string,
		userId = "user-123",
	) => ({
		id: faker.string.uuid(),
		name: "Default",
		description: "Default agenda category",
		eventId,
		organizationId,
		isDefaultCategory: true,
		creatorId: userId,
	});

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		const mutationType = schema.getType("Mutation") as GraphQLObjectType;
		const createEventField = mutationType.getFields().createEvent;
		if (!createEventField) {
			throw new Error("createEvent mutation field not found");
		}
		createEventMutationResolver =
			createEventField.resolve as typeof createEventMutationResolver;
		if (!createEventMutationResolver) {
			throw new Error("createEvent mutation resolver not found");
		}
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("when performance tracker is available", () => {
		it("should track mutation execution time on successful mutation", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000); // Tomorrow
			const endAt = new Date(startAt.getTime() + 3600000); // 1 hour later

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization with membership
			const mockOrganization = createMockOrganization(organizationId);

			// Mock created event
			const mockCreatedEvent = createMockEvent(organizationId, startAt, endAt);

			// Mock agenda folder
			const mockAgendaFolder = createMockAgendaFolder(
				mockCreatedEvent.id,
				organizationId,
			);

			// Mock agenda category
			const mockAgendaCategory = createMockAgendaCategory(
				mockCreatedEvent.id,
				organizationId,
			);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

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
							insert: vi.fn((table: unknown) => {
								if (table === eventsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockCreatedEvent]),
										}),
									};
								}
								if (table === agendaFoldersTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockAgendaFolder]),
										}),
									};
								}
								if (table === agendaCategoriesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockAgendaCategory]),
										}),
									};
								}
								return {
									values: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]),
									}),
								};
							}),
						};
						return callback(mockTx as never);
					},
				);

			// Mock notification service
			const mockNotification = {
				enqueueEventCreated: vi.fn(),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockResolvedValue(undefined),
			};
			context.notification = mockNotification;

			const resultPromise = createEventMutationResolver(
				null,
				{
					input: {
						name: "Test Event",
						description: "Test Description",
						organizationId,
						startAt,
						endAt,
						allDay: false,
						isPublic: false,
						isRegisterable: false,
						isInviteOnly: false,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();

			const snapshot = perf.snapshot();
			const mainOp = snapshot.ops["mutation:createEvent"];
			const enqueueOp =
				snapshot.ops["mutation:createEvent:notification:enqueue"];
			const flushOp = snapshot.ops["mutation:createEvent:notification:flush"];

			expect(mainOp).toBeDefined();
			expect(mainOp?.count).toBe(1);
			expect(mainOp?.ms).toBeGreaterThanOrEqual(0);

			// Notification operations should be tracked
			expect(enqueueOp).toBeDefined();
			expect(enqueueOp?.count).toBe(1);
			expect(flushOp).toBeDefined();
			expect(flushOp?.count).toBe(1);
		});

		it("should track mutation execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			// Invalid input (start date in past) triggers validation error
			// Use a date more than 2 seconds in the past (grace period is 2000ms)
			const pastDate = new Date(Date.now() - 5000); // 5 seconds ago

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId: faker.string.uuid(),
							startAt: pastDate,
							endAt: new Date(pastDate.getTime() + 3600000),
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
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track notification operations even when notification service throws", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = {
				id: "user-123",
				role: "regular" as const,
				name: "Test User",
			};

			// Mock organization
			const mockOrganization = {
				id: organizationId,
				name: "Test Organization",
				countryCode: "US",
				membershipsWhereOrganization: [
					{
						role: "admin" as const,
					},
				],
			};

			// Mock created event
			const mockCreatedEvent = createMockEvent(organizationId, startAt, endAt);

			// Mock agenda folder and category
			const mockAgendaFolder = createMockAgendaFolder(
				mockCreatedEvent.id,
				organizationId,
			);
			const mockAgendaCategory = createMockAgendaCategory(
				mockCreatedEvent.id,
				organizationId,
			);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			// Mock transaction with table-specific returns
			(
				mocks.drizzleClient as unknown as {
					transaction?: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(
					async (callback: (tx: unknown) => Promise<unknown>) => {
						const mockTx = {
							insert: vi.fn((table: unknown) => {
								if (table === eventsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockCreatedEvent]),
										}),
									};
								}
								if (table === agendaFoldersTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockAgendaFolder]),
										}),
									};
								}
								if (table === agendaCategoriesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockAgendaCategory]),
										}),
									};
								}
								return {
									values: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]),
									}),
								};
							}),
						};
						return callback(mockTx as never);
					},
				);

			// Mock notification service that throws
			const mockNotification = {
				enqueueEventCreated: vi.fn().mockImplementation(() => {
					throw new Error("Notification service error");
				}),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockRejectedValue(new Error("Flush error")),
			};
			context.notification = mockNotification;

			const resultPromise = createEventMutationResolver(
				null,
				{
					input: {
						name: "Test Event",
						description: "Test Description",
						organizationId,
						startAt,
						endAt,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			// Mutation should still succeed despite notification errors
			expect(result).toBeDefined();

			const snapshot = perf.snapshot();
			const mainOp = snapshot.ops["mutation:createEvent"];
			const flushOp = snapshot.ops["mutation:createEvent:notification:flush"];

			expect(mainOp).toBeDefined();
			expect(mainOp?.count).toBe(1);

			// Note: enqueue operation won't be tracked when enqueueEventCreated throws synchronously
			// because stopTiming() is never called (the exception is caught by the outer try/catch)
			// The flush operation should still be tracked (it's awaited and tracked even if it rejects)
			expect(flushOp).toBeDefined();
			expect(flushOp?.count).toBe(1);
		});

		it("should track mutation execution time on unauthenticated error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(false);
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			await vi.runAllTimersAsync();

			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
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
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time on unauthorized error (non-member)", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization WITHOUT membership for the calling user
			const mockOrganization = {
				id: organizationId,
				name: "Test Organization",
				countryCode: "US",
				membershipsWhereOrganization: [], // Empty - user is not a member
			};

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			await vi.runAllTimersAsync();

			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when isPublic and isInviteOnly are both true", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
							isPublic: true,
							isInviteOnly: true, // Both true should trigger error
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
				const issues = (error as TalawaGraphQLError).extensions?.issues;
				expect(issues).toBeDefined();
				expect(issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "isPublic"],
							message: "cannot be both Public and Invite-Only",
						}),
						expect.objectContaining({
							argumentPath: ["input", "isInviteOnly"],
							message: "cannot be both Public and Invite-Only",
						}),
					]),
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when recurrence validation fails", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock validateRecurrenceInput to return invalid
			vi.spyOn(
				await import("~/src/utilities/recurringEvent"),
				"validateRecurrenceInput",
			).mockReturnValue({
				isValid: false,
				errors: ["Recurrence end date must be after event start date"],
			});

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
							recurrence: {
								frequency: "DAILY",
								endDate: new Date(startAt.getTime() - 86400000), // Before start date
							},
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
				const issues = (error as TalawaGraphQLError).extensions?.issues;
				expect(issues).toBeDefined();
				expect(issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "recurrence"],
							message: "Recurrence end date must be after event start date",
						}),
					]),
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);

			vi.restoreAllMocks();
		});

		it("should track mutation execution time when organization is not found", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization lookup to return undefined (not found)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				undefined, // Organization not found
			);

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation execution time when generation window needs initialization", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization
			const mockOrganization = createMockOrganization(organizationId);

			// Mock created event
			const mockCreatedEvent = createMockEvent(organizationId, startAt, endAt);

			// Mock agenda folder and category
			const mockAgendaFolder = createMockAgendaFolder(
				mockCreatedEvent.id,
				organizationId,
			);
			const mockAgendaCategory = createMockAgendaCategory(
				mockCreatedEvent.id,
				organizationId,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			// Mock initializeGenerationWindow to be called
			const initWindowSpy = vi
				.spyOn(
					await import("~/src/services/eventGeneration"),
					"initializeGenerationWindow",
				)
				.mockResolvedValue({
					id: faker.string.uuid(),
					organizationId,
					currentWindowEndDate: new Date(),
					retentionStartDate: new Date(),
					hotWindowMonthsAhead: 12,
					historyRetentionMonths: 3,
					lastProcessedAt: new Date(),
					lastProcessedInstanceCount: 0,
					isEnabled: true,
					processingPriority: 5,
					maxInstancesPerRun: 1000,
					configurationNotes: null,
					createdById: "user-123",
					lastUpdatedById: null,
					createdAt: new Date(),
					updatedAt: null,
				});

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction?: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(
					async (callback: (tx: unknown) => Promise<unknown>) => {
						const mockTx = {
							insert: vi.fn((table: unknown) => {
								if (table === eventsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockCreatedEvent]),
										}),
									};
								}
								if (table === agendaFoldersTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockAgendaFolder]),
										}),
									};
								}
								if (table === agendaCategoriesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockAgendaCategory]),
										}),
									};
								}
								return {
									values: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]),
									}),
								};
							}),
							query: {
								eventGenerationWindowsTable: {
									findFirst: vi.fn().mockResolvedValue(undefined), // No existing window
								},
							},
						};
						return callback(mockTx as never);
					},
				);

			// Mock notification service
			const mockNotification = {
				enqueueEventCreated: vi.fn(),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockResolvedValue(undefined),
			};
			context.notification = mockNotification;

			const resultPromise = createEventMutationResolver(
				null,
				{
					input: {
						name: "Test Event",
						description: "Test Description",
						organizationId,
						startAt,
						endAt,
						recurrence: {
							frequency: "DAILY",
							never: true,
						},
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			expect(initWindowSpy).toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);

			vi.restoreAllMocks();
		});

		it("should track mutation execution time when attachment upload fails", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization
			const mockOrganization = createMockOrganization(organizationId);

			// Mock created event
			const mockCreatedEvent = createMockEvent(organizationId, startAt, endAt);

			// Mock agenda folder and category
			const mockAgendaFolder = createMockAgendaFolder(
				mockCreatedEvent.id,
				organizationId,
			);
			const mockAgendaCategory = createMockAgendaCategory(
				mockCreatedEvent.id,
				organizationId,
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			// Track attachment name for cleanup verification
			const attachment1Name = faker.string.uuid();

			// Mock MinIO putObject to succeed first, then fail (to trigger cleanup)
			const putObjectSpy = vi.spyOn(mocks.minioClient.client, "putObject");
			putObjectSpy
				.mockResolvedValueOnce({
					etag: "mock-etag-1",
					versionId: null,
				})
				.mockRejectedValueOnce(new Error("Upload failed"));

			// Mock removeObject for cleanup verification
			const removeObjectSpy = vi.spyOn(
				mocks.minioClient.client,
				"removeObject",
			);
			removeObjectSpy.mockResolvedValue(undefined);

			// Mock transaction
			(
				mocks.drizzleClient as unknown as {
					transaction?: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(
					async (callback: (tx: unknown) => Promise<unknown>) => {
						const mockTx = {
							insert: vi.fn((table: unknown) => {
								if (table === eventsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockCreatedEvent]),
										}),
									};
								}
								if (table === agendaFoldersTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockAgendaFolder]),
										}),
									};
								}
								if (table === agendaCategoriesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockAgendaCategory]),
										}),
									};
								}
								if (table === eventAttachmentsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([
												{
													id: faker.string.uuid(),
													eventId: mockCreatedEvent.id,
													name: attachment1Name,
													mimeType: "image/png",
													objectName: faker.string.uuid(),
													fileHash: "hash1",
												},
												{
													id: faker.string.uuid(),
													eventId: mockCreatedEvent.id,
													name: faker.string.uuid(),
													mimeType: "image/png",
													objectName: faker.string.uuid(),
													fileHash: "hash2",
												},
											]),
										}),
									};
								}
								return {
									values: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]),
									}),
								};
							}),
						};
						return callback(mockTx as never);
					},
				);

			// Mock notification service
			const mockNotification = {
				enqueueEventCreated: vi.fn(),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockResolvedValue(undefined),
			};
			context.notification = mockNotification;

			// Create mock attachments (two attachments - first succeeds, second fails)
			const mockAttachment1 = Promise.resolve({
				filename: "test1.png",
				mimetype: "image/png",
				createReadStream: vi.fn().mockReturnValue({
					pipe: vi.fn(),
					on: vi.fn(),
				}),
			});
			const mockAttachment2 = Promise.resolve({
				filename: "test2.png",
				mimetype: "image/png",
				createReadStream: vi.fn().mockReturnValue({
					pipe: vi.fn(),
					on: vi.fn(),
				}),
			});

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
							attachments: [mockAttachment1, mockAttachment2],
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Upload failed");
			}

			// Verify cleanup was called (removeObject should be called for successfully uploaded files)
			// First attachment upload succeeds, second fails, so cleanup should remove the first
			expect(putObjectSpy).toHaveBeenCalledTimes(2);
			expect(removeObjectSpy).toHaveBeenCalled();
			expect(removeObjectSpy).toHaveBeenCalledWith(
				expect.any(String), // bucketName
				attachment1Name, // First attachment name that was successfully uploaded
			);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});
	});

	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization
			const mockOrganization = createMockOrganization(organizationId);

			// Mock created event
			const mockCreatedEvent = createMockEvent(organizationId, startAt, endAt);

			// Mock database queries
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			// Mock agenda folder and category
			const mockAgendaFolder = createMockAgendaFolder(
				mockCreatedEvent.id,
				organizationId,
			);
			const mockAgendaCategory = createMockAgendaCategory(
				mockCreatedEvent.id,
				organizationId,
			);

			// Mock transaction with table-specific returns
			(
				mocks.drizzleClient as unknown as {
					transaction?: ReturnType<typeof vi.fn>;
				}
			).transaction = vi
				.fn()
				.mockImplementation(
					async (callback: (tx: unknown) => Promise<unknown>) => {
						const mockTx = {
							insert: vi.fn((table: unknown) => {
								if (table === eventsTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockCreatedEvent]),
										}),
									};
								}
								if (table === agendaFoldersTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([mockAgendaFolder]),
										}),
									};
								}
								if (table === agendaCategoriesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockAgendaCategory]),
										}),
									};
								}
								return {
									values: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([]),
									}),
								};
							}),
						};
						return callback(mockTx as never);
					},
				);

			// Mock notification service
			const mockNotification = {
				enqueueEventCreated: vi.fn(),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockResolvedValue(undefined),
			};
			context.notification = mockNotification;

			const resultPromise = createEventMutationResolver(
				null,
				{
					input: {
						name: "Test Event",
						description: "Test Description",
						organizationId,
						startAt,
						endAt,
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			// Invalid input (start date in past) triggers validation error
			const pastDate = new Date(Date.now() - 5000);

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId: faker.string.uuid(),
							startAt: pastDate,
							endAt: new Date(pastDate.getTime() + 3600000),
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

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
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
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization WITHOUT membership for the calling user
			const mockOrganization = {
				id: organizationId,
				name: "Test Organization",
				countryCode: "US",
				membershipsWhereOrganization: [], // Empty - user is not a member
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			await vi.runAllTimersAsync();
			try {
				await createEventMutationResolver(
					null,
					{
						input: {
							name: "Test Event",
							description: "Test Description",
							organizationId,
							startAt,
							endAt,
						},
					},
					context,
				);
				expect.fail("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			}
		});
	});
});
