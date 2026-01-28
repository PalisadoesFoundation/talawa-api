import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	agendaCategoriesTable,
	agendaFoldersTable,
} from "~/src/drizzle/schema";
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
			const pastDate = new Date(Date.now() - 86400000); // Yesterday

			const resultPromise = createEventMutationResolver(
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

			await vi.runAllTimersAsync();
			try {
				await resultPromise;
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
			const enqueueOp =
				snapshot.ops["mutation:createEvent:notification:enqueue"];
			const flushOp = snapshot.ops["mutation:createEvent:notification:flush"];

			expect(mainOp).toBeDefined();
			expect(mainOp?.count).toBe(1);

			// Verify notification operations are tracked even when they throw
			// The enqueue operation should be tracked (it throws synchronously, so it's caught and tracked)
			expect(enqueueOp).toBeDefined();
			expect(enqueueOp?.count).toBe(1);
			// The flush operation should also be tracked (it's awaited and tracked even if it rejects)
			expect(flushOp).toBeDefined();
			expect(flushOp?.count).toBe(1);
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
	});
});
