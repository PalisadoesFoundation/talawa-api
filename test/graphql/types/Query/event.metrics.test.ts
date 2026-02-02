import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { ulid } from "ulidx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";
import * as eventQueries from "~/src/graphql/types/Query/eventQueries";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

// Mock the getEventsByIds function
vi.mock("~/src/graphql/types/Query/eventQueries", () => ({
	getEventsByIds: vi.fn(),
}));

describe("Query event - Performance Tracking", () => {
	let eventQueryResolver: (
		_parent: unknown,
		args: { input: { id: string } },
		ctx: ReturnType<typeof createMockGraphQLContext>["context"],
	) => Promise<unknown>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		const eventQueryType = schema.getType("Query") as GraphQLObjectType;
		const eventField = eventQueryType.getFields().event;
		if (!eventField) {
			throw new Error("Event query field not found");
		}
		eventQueryResolver = eventField.resolve as typeof eventQueryResolver;
		if (!eventQueryResolver) {
			throw new Error("Event query resolver not found");
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

			const eventId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Test Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve([mockEvent]), 10);
					}),
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "regular" }), 0);
					}),
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "member" }), 0);
					}),
			);
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 0);
					}),
			);

			const resultPromise = eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);
			// Use runAllTimersAsync to ensure all timers complete
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual(mockEvent);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time on unauthenticated error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(false);
			context.perf = perf;

			// Unauthenticated error happens synchronously, but perf tracker still measures it
			await expect(
				eventQueryResolver(null, { input: { id: ulid() } }, context),
			).rejects.toThrow();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			// Error happens synchronously, so time may be 0ms, but metrics are still collected
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on validation error", async () => {
			const perf = createPerformanceTracker();
			const { context } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			// Validation error happens synchronously during parsing
			// The perf tracker still measures the time, even if it's very short
			// Still need to advance timers since we're using fake timers globally
			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					eventQueryResolver(null, { input: { id: "invalid-id" } }, context),
				).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			// Validation happens synchronously, so time may be 0ms, but metrics are still collected
			expect(op?.ms).toBeGreaterThanOrEqual(0);
		});

		it("should track query execution time on resource not found error", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve([]), 5);
					}),
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "regular" }), 0);
					}),
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ role: "member" }), 0);
					}),
			);
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(undefined), 0);
					}),
			);

			const resultPromise = eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);
			// Advance timers and wait for rejection in parallel to avoid unhandled rejection
			await Promise.all([
				vi.runAllTimersAsync(),
				expect(resultPromise).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track multiple query executions separately", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId1 = ulid();
			const eventId2 = ulid();
			const mockEvent1 = {
				id: eventId1,
				name: "Event 1",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};
			const mockEvent2 = {
				id: eventId2,
				name: "Event 2",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds)
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return [mockEvent1];
				})
				.mockImplementationOnce(async () => {
					await vi.advanceTimersByTimeAsync(0);
					return [mockEvent2];
				});
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return { role: "regular" };
				},
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return { role: "member" };
				},
			);
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return undefined;
				},
			);

			await eventQueryResolver(null, { input: { id: eventId1 } }, context);
			await eventQueryResolver(null, { input: { id: eventId2 } }, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(2);
		});
	});

	describe("when performance tracker is unavailable", () => {
		it("should execute query successfully without tracking", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = undefined;

			const eventId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Test Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockResolvedValue([mockEvent]);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{
					role: "member",
				},
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			expect(vi.mocked(eventQueries.getEventsByIds)).toHaveBeenCalledTimes(1);
		});

		it("should handle errors gracefully when perf tracker is unavailable", async () => {
			const { context } = createMockGraphQLContext(false);
			context.perf = undefined;

			await expect(
				eventQueryResolver(null, { input: { id: ulid() } }, context),
			).rejects.toThrow();
		});
	});

	describe("query functionality preservation", () => {
		it("should preserve existing query behavior with perf tracker", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Test Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "user-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockResolvedValue([mockEvent]);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{
					role: "member",
				},
			);
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			expect(vi.mocked(eventQueries.getEventsByIds)).toHaveBeenCalledWith(
				[eventId],
				context.drizzleClient,
				context.log,
			);
		});

		it("should allow non-member invited to invite-only event to view it", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Invite-Only Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true,
				organizationId,
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return { role: "regular" };
				},
			);
			// Non-member: no organization membership
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
			// But user is invited to the event
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockImplementation(
				async () => {
					await vi.advanceTimersByTimeAsync(0);
					return {
						userId: "user-123",
						eventId,
						isInvited: true,
						isRegistered: false,
					};
				},
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			expect(vi.mocked(eventQueries.getEventsByIds)).toHaveBeenCalledWith(
				[eventId],
				context.drizzleClient,
				context.log,
			);
		});

		it("should track metrics when currentUser is not found after event fetch", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Test Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			// User is not found in DB after event is fetched
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					eventQueryResolver(null, { input: { id: eventId } }, context),
				).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should track metrics on unauthorized action when not member or attendee", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Test Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: ulid(),
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			// Regular user (not admin)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			// Not a member
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
			// Not an attendee
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await Promise.all([
				vi.runAllTimersAsync(),
				expect(
					eventQueryResolver(null, { input: { id: eventId } }, context),
				).rejects.toThrow(),
			]);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should allow admin to view invite-only event", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Invite-Only Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true,
				organizationId,
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			// User is system administrator
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			// Member of organization
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{ role: "member" },
			);
			// Not an attendee
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should deny access to invite-only event when not creator, admin, or attendee", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Invite-Only Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true,
				organizationId,
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			// Regular user (not admin)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			// Member but not admin in org
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{ role: "member" },
			);
			// Not an attendee - returns undefined on both calls (authz check + invite-only check)
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			// Should return null for invite-only event user cannot access
			expect(result).toBeNull();
			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should allow org admin to access invite-only event", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Invite-Only Event",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true,
				organizationId,
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "standalone" as const,
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});

			// Regular user (not system admin)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			// Organization admin (this grants access)
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{ role: "administrator" },
			);

			// Not an attendee (but org admin access overrides invite-only)
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			// Should return event because user is org admin
			expect(result).toEqual(mockEvent);
			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should handle recurring event instance attendee check", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Recurring Event Instance",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId,
				creatorId: "other-user",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "generated" as const, // Recurring event instance uses 'generated' type
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
			// Attendee of recurring instance
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				{
					userId: "user-123",
					recurringEventInstanceId: eventId,
					isInvited: true,
					isRegistered: false,
				},
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should allow attendee of invite-only generated event to view it", async () => {
			const perf = createPerformanceTracker();
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			context.perf = perf;

			const eventId = ulid();
			const organizationId = ulid();
			const mockEvent = {
				id: eventId,
				name: "Invite-Only Recurring Instance",
				description: null,
				startAt: new Date(),
				endAt: new Date(),
				location: null,
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true, // Invite-only event
				organizationId,
				creatorId: "other-user", // Not the current user
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
				isRecurringEventTemplate: false,
				attachments: [],
				eventType: "generated" as const, // Generated = recurring instance
			};

			vi.mocked(eventQueries.getEventsByIds).mockImplementation(async () => {
				await vi.advanceTimersByTimeAsync(0);
				return [mockEvent];
			});
			// Regular user (not system admin)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});
			// Member but not org admin
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				{
					role: "member",
				},
			);
			// User is attendee of the recurring instance (via recurringEventInstanceId)
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				{
					userId: "user-123",
					recurringEventInstanceId: eventId,
					isInvited: true,
					isRegistered: false,
				},
			);

			const result = await eventQueryResolver(
				null,
				{ input: { id: eventId } },
				context,
			);

			expect(result).toEqual(mockEvent);
			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:event"];
			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});
	});
});
