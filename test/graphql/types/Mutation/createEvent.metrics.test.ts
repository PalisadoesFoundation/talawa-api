/**
 * Test suite for createEvent mutation performance tracking and metrics.
 *
 * Verifies that the createEvent resolver integrates correctly with the performance
 * tracker (ctx.perf), records mutation timing, and degrades gracefully when the
 * tracker is unavailable. Uses direct resolver invocation for precise control over
 * context.perf and attachment/MIME validation behavior.
 */
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
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";

/**
 * Performance-tracking tests for the createEvent mutation resolver.
 * Uses direct resolver invocation to control context.perf and verify timing/metrics.
 */
describe("Mutation createEvent - Performance Tracking", () => {
	let createEventMutationResolver: (
		_parent: unknown,
		args: { input: Record<string, unknown> },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	/** Builds a mock user for auth/context. */
	const createMockUser = (
		userId: string,
		role: "regular" | "administrator" = "regular",
	) => ({
		id: userId,
		role,
		name: "Test User",
	});

	/** Builds a mock organization with admin membership. */
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

	/** Builds a mock event record for insert/return. */
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

	/** Builds a mock agenda folder for the event. */
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

	/** Builds a mock agenda category for the event. */
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

	/** Tests with ctx.perf set; verifies timing and operation names. */
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

			// Enqueue timing IS recorded because stopTiming() is in a finally block,
			// so even when enqueueEventCreated throws synchronously, the timing is captured.
			const enqueueOp =
				snapshot.ops["mutation:createEvent:notification:enqueue"];
			expect(enqueueOp).toBeDefined();
			expect(enqueueOp?.count).toBe(1);

			// The flush operation is also tracked (awaited and tracked even if it rejects)
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
					"arguments_associated_resources_not_found",
				);
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track mutation when generation window needs initialization", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const organizationId = faker.string.uuid();
			const startAt = new Date(Date.now() + 86400000);
			const endAt = new Date(startAt.getTime() + 3600000);
			const recurrenceEndDate = new Date(startAt.getTime() + 30 * 86400000); // 30 days later

			// Mock current user
			const mockCurrentUser = createMockUser("user-123");

			// Mock organization
			const mockOrganization = createMockOrganization(organizationId);

			// Mock created event (recurring)
			const mockCreatedEvent = {
				...createMockEvent(organizationId, startAt, endAt),
				isRecurring: true,
			};

			// Mock recurrence rule
			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				recurrenceRuleString: "FREQ=DAILY;UNTIL=20260301",
				frequency: "DAILY",
				baseRecurringEventId: mockCreatedEvent.id,
				latestInstanceDate: startAt,
			};

			// Mock generation window config that will be returned from initialization
			const mockWindowConfig = {
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
			};

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

			// Mock eventGenerationWindowsTable.findFirst to return undefined (no existing window)
			// This is on ctx.drizzleClient, not the transaction
			(
				mocks.drizzleClient.query as {
					eventGenerationWindowsTable?: { findFirst: ReturnType<typeof vi.fn> };
				}
			).eventGenerationWindowsTable = {
				findFirst: vi.fn().mockResolvedValueOnce(undefined),
			};

			// Import and mock recurrenceRulesTable
			const { recurrenceRulesTable } = await import("~/src/drizzle/schema");
			const { recurringEventInstancesTable } = await import(
				"~/src/drizzle/schema"
			);

			// Mock transaction with all required table mocks
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
								if (table === recurrenceRulesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi
												.fn()
												.mockResolvedValue([mockRecurrenceRule]),
										}),
									};
								}
								if (table === recurringEventInstancesTable) {
									return {
										values: vi.fn().mockReturnValue({
											returning: vi.fn().mockResolvedValue([]),
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

			// Mock initializeGenerationWindow
			const eventGenerationModule = await import(
				"~/src/services/eventGeneration"
			);
			const initWindowSpy = vi
				.spyOn(eventGenerationModule, "initializeGenerationWindow")
				.mockResolvedValue(mockWindowConfig);

			// Mock generateInstancesForRecurringEvent (called after recurrence rule creation)
			vi.spyOn(
				eventGenerationModule,
				"generateInstancesForRecurringEvent",
			).mockResolvedValue(0);

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
						name: "Test Recurring Event",
						description: "Test Description",
						organizationId,
						startAt,
						endAt,
						recurrence: {
							frequency: "DAILY",
							endDate: recurrenceEndDate,
						},
					},
				},
				context,
			);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toBeDefined();
			// Verify initializeGenerationWindow was called since no window existed
			expect(initWindowSpy).toHaveBeenCalled();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);

			vi.restoreAllMocks();
		});

		it("should track mutation and trigger cleanup when attachment upload fails", async () => {
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

			// Import eventAttachmentsTable
			const { eventAttachmentsTable } = await import("~/src/drizzle/schema");

			// Track attachment names for cleanup verification
			const attachment1Name = "attachment-1-name";
			const attachment2Name = "attachment-2-name";

			// Mock created attachments (what the DB insert returns)
			const mockAttachmentRecords = [
				{
					id: faker.string.uuid(),
					eventId: mockCreatedEvent.id,
					name: attachment1Name,
					mimeType: "image/png",
					creatorId: "user-123",
				},
				{
					id: faker.string.uuid(),
					eventId: mockCreatedEvent.id,
					name: attachment2Name,
					mimeType: "image/png",
					creatorId: "user-123",
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

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
											returning: vi
												.fn()
												.mockResolvedValue(mockAttachmentRecords),
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

			// Mock MinIO putObject: first succeeds, second fails
			const putObjectMock = vi.fn();
			putObjectMock
				.mockResolvedValueOnce({ etag: "mock-etag-1", versionId: null }) // First upload succeeds
				.mockRejectedValueOnce(new Error("Upload failed for attachment 2")); // Second fails

			// Mock removeObject for cleanup verification
			const removeObjectMock = vi.fn().mockResolvedValue(undefined);

			mocks.minioClient.client.putObject = putObjectMock;
			mocks.minioClient.client.removeObject = removeObjectMock;

			// Mock notification service
			const mockNotification = {
				enqueueEventCreated: vi.fn(),
				enqueueSendEventInvite: vi.fn(),
				flush: vi.fn().mockResolvedValue(undefined),
			};
			context.notification = mockNotification;

			// Create mock file uploads with proper stream mocks
			const createMockReadStream = () => ({
				pipe: vi.fn().mockReturnThis(),
				on: vi.fn().mockReturnThis(),
				[Symbol.asyncIterator]: vi.fn(),
			});

			const mockAttachment1 = Promise.resolve({
				filename: "test1.png",
				mimetype: "image/png",
				createReadStream: vi.fn().mockReturnValue(createMockReadStream()),
				encoding: "7bit",
				fieldName: "attachments",
			});
			const mockAttachment2 = Promise.resolve({
				filename: "test2.png",
				mimetype: "image/png",
				createReadStream: vi.fn().mockReturnValue(createMockReadStream()),
				encoding: "7bit",
				fieldName: "attachments",
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
				expect((error as Error).message).toContain(
					"Upload failed for attachment 2",
				);
			}

			// Verify putObject was called for both attachments
			expect(putObjectMock).toHaveBeenCalledTimes(2);

			// Verify cleanup was called for the successfully uploaded file
			expect(removeObjectMock).toHaveBeenCalled();
			expect(removeObjectMock).toHaveBeenCalledWith(
				expect.any(String), // bucketName
				attachment1Name, // First attachment that was successfully uploaded
			);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should reject invalid MIME type for attachments with indexed error path", async () => {
			// Use real timers so resolver and zod validation run without fake-timer interference.
			// Fake timers can cause "10000 timers" infinite loop when this test runs in CI.
			vi.useRealTimers();

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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockCurrentUser,
			);
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization,
			);

			// Create mock file uploads with valid and invalid MIME types
			const createMockReadStream = () => ({
				pipe: vi.fn().mockReturnThis(),
				on: vi.fn().mockReturnThis(),
				[Symbol.asyncIterator]: vi.fn(),
			});

			// First attachment: valid image MIME type
			const mockValidAttachment = Promise.resolve({
				filename: "valid.png",
				mimetype: "image/png", // Valid
				createReadStream: vi.fn().mockReturnValue(createMockReadStream()),
				encoding: "7bit",
				fieldName: "attachments",
			});

			// Second attachment: invalid text/plain MIME type
			const mockInvalidAttachment = Promise.resolve({
				filename: "invalid.txt",
				mimetype: "text/plain", // Invalid - not in eventAttachmentMimeTypeEnum
				createReadStream: vi.fn().mockReturnValue(createMockReadStream()),
				encoding: "7bit",
				fieldName: "attachments",
			});

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
							attachments: [mockValidAttachment, mockInvalidAttachment],
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

				// Verify the error includes indexed path to the invalid attachment
				const issues = (error as TalawaGraphQLError).extensions
					?.issues as Array<{ argumentPath: unknown[] }>;
				expect(issues).toBeDefined();
				expect(Array.isArray(issues)).toBe(true);

				// Should have an issue pointing to attachments[1] (the invalid one)
				const attachmentIssue = issues?.find(
					(issue) =>
						Array.isArray(issue.argumentPath) &&
						issue.argumentPath[0] === "input" &&
						issue.argumentPath[1] === "attachments" &&
						issue.argumentPath[2] === 1,
				);
				expect(attachmentIssue).toBeDefined();
			}

			const snapshot = perf.snapshot();
			const op = snapshot.ops["mutation:createEvent"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});
	});

	/** Tests with ctx.perf undefined; verifies graceful degradation. */
	describe("when performance tracker is not available", () => {
		it("should execute mutation successfully without perf tracker", async () => {
			// Use real timers so resolver runs without fake-timer interference and cleanup behaves correctly.
			// Fake timers can cause "10000 timers" infinite loop when this test runs in CI.
			vi.useRealTimers();
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
			const result = await resultPromise;

			expect(result).toBeDefined();
		});

		it("should handle validation error without perf tracker", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			// Invalid input (start date in past) triggers validation error
			const pastDate = new Date(Date.now() - 5000);

			// Validation error happens synchronously - no timer advancement needed
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

			// Resolver throws immediately for unauthenticated; no timer advancement needed
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

			// Resolver throws immediately for unauthorized; no timer advancement needed
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

	describe("mercuriusClient smoke test for schema wiring", () => {
		beforeEach(() => {
			vi.useRealTimers();
		});
		afterEach(() => {
			vi.useFakeTimers();
		});

		it("should execute createEvent mutation through mercuriusClient with schema wiring", async () => {
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
			expect(signInResult.data?.signIn?.user?.id).toBeDefined();
			const authToken = signInResult.data?.signIn?.authenticationToken;
			const adminUserId = signInResult.data?.signIn?.user?.id;
			if (!authToken || !adminUserId) {
				throw new Error("Auth token or user ID is undefined");
			}

			// Create an organization for the event
			const orgName = `Smoke Test Org ${faker.string.ulid()}`;
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: orgName,
							description: "Smoke test organization",
						},
					},
				},
			);

			expect(createOrgResult.errors).toBeUndefined();
			expect(createOrgResult.data?.createOrganization?.id).toBeDefined();
			const orgId = createOrgResult.data?.createOrganization?.id;
			if (!orgId) {
				throw new Error("Organization ID is undefined");
			}

			// Create organization membership to ensure user can create events
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminUserId,
						role: "administrator",
					},
				},
			});

			// Execute createEvent mutation through mercuriusClient
			const eventName = `Smoke Test Event ${faker.string.ulid()}`;
			const startAt = new Date(Date.now() + 86400000); // Tomorrow
			const endAt = new Date(startAt.getTime() + 3600000); // 1 hour later

			const result = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: eventName,
						description: "Smoke test event description",
						organizationId: orgId,
						startAt: startAt.toISOString(),
						endAt: endAt.toISOString(),
					},
				},
			});

			// Verify schema wiring works (mutation executes successfully)
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toBeDefined();
			expect(result.data?.createEvent?.name).toBe(eventName);

			// Cleanup: Delete the created event and organization
			const eventId = result.data?.createEvent?.id;
			if (!eventId) {
				throw new Error("Event ID is undefined");
			}
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: eventId,
					},
				},
			});

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

			// Note: Performance tracking verification is done in the direct resolver tests above
			// This smoke test only verifies that the schema wiring is correct and the mutation
			// can be executed through the full GraphQL execution pipeline.
		});
	});
});
