import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import type { GraphQLContext } from "~/src/graphql/context";
import { userEventsAttendedResolver } from "~/src/graphql/types/User/eventsAttended";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("User EventsAttended Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockUser: UserType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockUser = {
			id: "user-789",
			name: "John Doe",
			emailAddress: "john@example.com",
			role: "regular",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: null,
			creatorId: "creator-123",
			updaterId: null,
		} as UserType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false);

			await expect(
				userEventsAttendedResolver(mockUser, {}, unauthCtx),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				userEventsAttendedResolver(mockUser, {}, unauthCtx),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});
	});

	describe("Empty Attendances", () => {
		it("should return empty array when user has no event attendances", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				[],
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // eq() function result
				with: {
					event: {
						with: {
							attachmentsWhereEvent: true,
						},
					},
					recurringEventInstance: {
						with: {
							baseRecurringEvent: true,
						},
					},
				},
			});
		});
	});

	describe("Standalone Event Attendances", () => {
		it("should resolve standalone events correctly", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					userId: "user-789",
					eventId: "event-123",
					event: {
						id: "event-123",
						name: "Standalone Event",
						description: "Test standalone event",
						startAt: new Date("2024-03-15T10:00:00Z"),
						endAt: new Date("2024-03-15T12:00:00Z"),
						organizationId: "org-123",
						isPublic: true,
						allDay: false,
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				...mockAttendances[0]?.event,
				attachments: [],
			});
		});

		it("should handle multiple standalone events", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "First Event",
						organizationId: "org-123",
					},
					recurringEventInstance: null,
				},
				{
					id: "attendance-2",
					event: {
						id: "event-456",
						name: "Second Event",
						organizationId: "org-123",
					},
					recurringEventInstance: null,
				},
				{
					id: "attendance-3",
					event: {
						id: "event-789",
						name: "Third Event",
						organizationId: "org-456", // Different org
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(3);
			expect(result[0]?.name).toBe("First Event");
			expect(result[1]?.name).toBe("Second Event");
			expect(result[2]?.name).toBe("Third Event");

			// All should have empty attachments
			for (const event of result) {
				expect(event?.attachments).toEqual([]);
			}
		});

		it("should handle standalone events with undefined attachmentsWhereEvent", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					userId: "user-789",
					eventId: "event-123",
					event: {
						id: "event-123",
						name: "Event with undefined attachments",
						description: "Test event",
						startAt: new Date("2024-03-15T10:00:00Z"),
						endAt: new Date("2024-03-15T12:00:00Z"),
						organizationId: "org-123",
						isPublic: true,
						allDay: false,
						attachmentsWhereEvent: undefined,
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Event with undefined attachments");
			expect(result[0]?.attachments).toEqual([]);
		});

		it("should handle standalone events with null attachmentsWhereEvent", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					userId: "user-789",
					eventId: "event-123",
					event: {
						id: "event-123",
						name: "Event with null attachments",
						description: "Test event",
						startAt: new Date("2024-03-15T10:00:00Z"),
						endAt: new Date("2024-03-15T12:00:00Z"),
						organizationId: "org-123",
						isPublic: true,
						allDay: false,
						attachmentsWhereEvent: null,
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Event with null attachments");
			expect(result[0]?.attachments).toEqual([]);
		});

		it("should return attachments when they exist for standalone events", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					userId: "user-789",
					eventId: "event-123",
					event: {
						id: "event-123",
						name: "Event with Attachments",
						description: "Test event with attachments",
						startAt: new Date("2024-03-15T10:00:00Z"),
						endAt: new Date("2024-03-15T12:00:00Z"),
						organizationId: "org-123",
						isPublic: true,
						allDay: false,
						attachmentsWhereEvent: [
							{
								id: "attach-1",
								name: "document.pdf",
								mimeType: "application/pdf",
							},
							{
								id: "attach-2",
								name: "image.png",
								mimeType: "image/png",
							},
						],
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Event with Attachments");
			expect(result[0]?.attachments).toHaveLength(2);
			expect(result[0]?.attachments[0]?.name).toBe("document.pdf");
			expect(result[0]?.attachments[0]?.mimeType).toBe("application/pdf");
			expect(result[0]?.attachments[1]?.name).toBe("image.png");
			expect(result[0]?.attachments[1]?.mimeType).toBe("image/png");
		});
	});

	describe("Recurring Event Instance Attendances", () => {
		it("should resolve recurring event instances correctly", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					userId: "user-789",
					recurringEventInstanceId: "instance-123",
					event: null,
					recurringEventInstance: {
						id: "instance-123",
						baseRecurringEventId: "template-456",
						originalInstanceStartTime: new Date("2024-03-15T10:00:00Z"),
						actualStartTime: new Date("2024-03-15T10:00:00Z"),
						actualEndTime: new Date("2024-03-15T12:00:00Z"),
						sequenceNumber: 3,
						totalCount: 10,
						organizationId: "org-123",
						baseRecurringEvent: {
							id: "template-456",
							name: "Weekly Team Meeting",
							description: "Recurring weekly meeting",
							organizationId: "org-123",
							isRecurringEventTemplate: true,
						},
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);

			const recurringInstance = mockAttendances[0]?.recurringEventInstance;
			expect(result[0]).toEqual({
				...recurringInstance?.baseRecurringEvent,
				...recurringInstance,
				attachments: [],
			});

			// Should include both template and instance properties
			expect(result[0]?.name).toBe("Weekly Team Meeting"); // From template
			expect(
				(result[0] as unknown as ResolvedRecurringEventInstance)
					?.sequenceNumber,
			).toBe(3); // From instance
		});

		it("should handle mixed standalone and recurring events", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "One-time Conference",
						organizationId: "org-123",
					},
					recurringEventInstance: null,
				},
				{
					id: "attendance-2",
					event: null,
					recurringEventInstance: {
						id: "instance-456",
						baseRecurringEventId: "template-789",
						sequenceNumber: 2,
						organizationId: "org-123",
						baseRecurringEvent: {
							id: "template-789",
							name: "Monthly Review",
							organizationId: "org-123",
						},
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(2);
			expect(result[0]?.name).toBe("One-time Conference");
			expect(result[1]?.name).toBe("Monthly Review");
			expect(
				(result[1] as unknown as ResolvedRecurringEventInstance)
					?.sequenceNumber,
			).toBe(2); // Should include instance data
		});
	});

	describe("Data Filtering", () => {
		it("should filter out attendances with no associated event data", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Valid Event",
					},
					recurringEventInstance: null,
				},
				{
					id: "attendance-2", // Invalid - no event or instance
					event: null,
					recurringEventInstance: null,
				},
				{
					id: "attendance-3",
					event: null,
					recurringEventInstance: {
						id: "instance-456",
						baseRecurringEvent: {
							id: "template-789",
							name: "Valid Recurring Event",
						},
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			// Should filter out attendance-2 (invalid)
			expect(result).toHaveLength(2);
			expect(result[0]?.name).toBe("Valid Event");
			expect(result[1]?.name).toBe("Valid Recurring Event");
		});

		it("should handle null/undefined event data gracefully", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: null,
					recurringEventInstance: null,
				},
				{
					id: "attendance-2",
					event: undefined,
					recurringEventInstance: undefined,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances as unknown as Awaited<
					ReturnType<
						typeof mocks.drizzleClient.query.eventAttendeesTable.findMany
					>
				>,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toEqual([]); // Should filter out all invalid entries
		});
	});

	describe("Error Handling", () => {
		it("should wrap generic database errors", async () => {
			const databaseError = new Error("Connection pool exhausted");

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				databaseError,
			);

			await expect(
				userEventsAttendedResolver(mockUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(databaseError);
		});

		it("should handle query timeout errors", async () => {
			const timeoutError = new Error("Query execution timeout");

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				timeoutError,
			);

			await expect(
				userEventsAttendedResolver(mockUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(timeoutError);
		});

		it("should handle database constraint violations", async () => {
			const constraintError = new Error("Foreign key constraint failed");

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				constraintError,
			);

			await expect(
				userEventsAttendedResolver(mockUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(constraintError);
		});
	});

	describe("Performance Tests", () => {
		it("should handle users with many event attendances", async () => {
			// User attended 100 different events
			const manyAttendances = Array.from({ length: 100 }, (_, i) => ({
				id: `attendance-${i}`,
				userId: "user-789",
				eventId: `event-${i}`,
				event: {
					id: `event-${i}`,
					name: `Event ${i}`,
					description: `Description for event ${i}`,
					organizationId: "org-123",
					startAt: new Date(
						`2024-03-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
					),
				},
				recurringEventInstance: null,
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				manyAttendances,
			);

			const startTime = Date.now();
			const result = await userEventsAttendedResolver(mockUser, {}, ctx);
			const endTime = Date.now();

			expect(result).toHaveLength(100);
			expect(endTime - startTime).toBeLessThan(500); // Should process 100 events quickly

			// Verify data integrity
			expect(result[0]?.name).toBe("Event 0");
			expect(result[99]?.name).toBe("Event 99");
		});

		it("should handle mixed event types efficiently", async () => {
			// Mix of 25 standalone + 25 recurring = 50 total
			const mixedAttendances = [
				...Array.from({ length: 25 }, (_, i) => ({
					id: `attendance-${i}`,
					event: {
						id: `event-${i}`,
						name: `Standalone ${i}`,
					},
					recurringEventInstance: null,
				})),
				...Array.from({ length: 25 }, (_, i) => ({
					id: `attendance-${i + 25}`,
					event: null,
					recurringEventInstance: {
						id: `instance-${i}`,
						sequenceNumber: i + 1,
						baseRecurringEvent: {
							id: `template-${i}`,
							name: `Recurring ${i}`,
						},
					},
				})),
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mixedAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(50);

			// Verify standalone events (first 25)
			for (let i = 0; i < 25; i++) {
				expect(result[i]?.name).toBe(`Standalone ${i}`);
			}

			// Verify recurring events (last 25)
			for (let i = 25; i < 50; i++) {
				expect(result[i]?.name).toBe(`Recurring ${i - 25}`);
				expect(
					(result[i] as unknown as ResolvedRecurringEventInstance)
						?.sequenceNumber,
				).toBe(i - 24); // Should have instance data
			}
		});
	});

	describe("Data Structure Validation", () => {
		it("should always include attachments array for standalone events", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Event with Attachments Test",
						organizationId: "org-123",
						// No attachments field in source data
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty("attachments", []);
		});

		it("should always include attachments array for recurring events", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: null,
					recurringEventInstance: {
						id: "instance-123",
						sequenceNumber: 1,
						baseRecurringEvent: {
							id: "template-456",
							name: "Recurring Meeting",
							// No attachments in template
						},
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty("attachments", []);
		});

		it("should merge instance data over base template data", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: null,
					recurringEventInstance: {
						id: "instance-123",
						baseRecurringEventId: "template-456",
						actualStartTime: new Date("2024-03-15T10:30:00Z"), // Instance-specific time
						sequenceNumber: 5,
						totalCount: 12,
						organizationId: "org-123",
						baseRecurringEvent: {
							id: "template-456",
							name: "Weekly Standup", // Template name
							description: "Team coordination meeting",
							organizationId: "org-123",
						},
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);

			const mergedEvent = result[0];
			expect(mergedEvent?.name).toBe("Weekly Standup"); // From template
			expect(
				(mergedEvent as unknown as ResolvedRecurringEventInstance)
					?.sequenceNumber,
			).toBe(5); // From instance
			expect(
				(mergedEvent as unknown as ResolvedRecurringEventInstance)
					?.actualStartTime,
			).toEqual(new Date("2024-03-15T10:30:00Z")); // From instance
			expect(mergedEvent?.attachments).toEqual([]);
		});
	});

	describe("Complex Data Scenarios", () => {
		it("should handle events with complete metadata", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Complete Event",
						description: "Event with all fields",
						location: "Conference Center",
						startAt: new Date("2024-03-15T09:00:00Z"),
						endAt: new Date("2024-03-15T17:00:00Z"),
						organizationId: "org-123",
						creatorId: "creator-123",
						updaterId: "updater-456",
						isPublic: true,
						isRegisterable: true,
						allDay: false,
						createdAt: new Date("2024-03-01T10:00:00Z"),
						updatedAt: new Date("2024-03-05T14:00:00Z"),
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				...mockAttendances[0]?.event,
				attachments: [],
			});

			// Verify all properties are preserved
			expect(result[0]?.location).toBe("Conference Center");
			expect(result[0]?.isPublic).toBe(true);
			expect(result[0]?.creatorId).toBe("creator-123");
		});

		it("should handle events with minimal data", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Minimal Event",
						// Only required fields present
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances as unknown as Awaited<
					ReturnType<
						typeof mocks.drizzleClient.query.eventAttendeesTable.findMany
					>
				>,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Minimal Event");
			expect(result[0]?.attachments).toEqual([]);
		});
	});

	describe("Edge Cases and Data Integrity", () => {
		it("should handle large user attendance history", async () => {
			// User attended 200 events over time
			const largeHistory = Array.from({ length: 200 }, (_, i) => ({
				id: `attendance-${i}`,
				event: {
					id: `event-${i}`,
					name: `Historical Event ${i}`,
					organizationId: `org-${i % 5}`, // Distributed across 5 orgs
					startAt: new Date(`2024-0${(i % 9) + 1}-01T10:00:00Z`), // Spread across months
				},
				recurringEventInstance: null,
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				largeHistory,
			);

			const startTime = Date.now();
			const result = await userEventsAttendedResolver(mockUser, {}, ctx);
			const endTime = Date.now();

			expect(result).toHaveLength(200);
			expect(endTime - startTime).toBeLessThan(1000); // Should process efficiently

			// Spot check data integrity
			expect(result[0]?.name).toBe("Historical Event 0");
			expect(result[199]?.name).toBe("Historical Event 199");
		});
	});

	describe("Recovery and Resilience", () => {
		it("should handle partial data corruption scenarios", async () => {
			const partiallyCorruptedData = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Good Event",
					},
				},
				{
					id: "attendance-2",
					event: {
						id: "event-456",
						// Missing name field
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				partiallyCorruptedData as unknown as Awaited<
					ReturnType<
						typeof mocks.drizzleClient.query.eventAttendeesTable.findMany
					>
				>,
			);

			const result = await userEventsAttendedResolver(mockUser, {}, ctx);

			// Should still process valid events
			expect(result).toHaveLength(2);
			expect(result[0]?.name).toBe("Good Event");
			expect(result[1]?.name).toBeUndefined(); // Corrupted data preserved
		});
	});

	describe("Concurrent Access", () => {
		it("should handle multiple simultaneous requests for same user", async () => {
			const mockAttendances = [
				{
					id: "attendance-1",
					event: {
						id: "event-123",
						name: "Concurrent Test Event",
					},
					recurringEventInstance: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendances,
			);

			// Run multiple concurrent calls for same user
			const concurrentCalls = Array.from({ length: 10 }, () =>
				userEventsAttendedResolver(mockUser, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			for (const result of results) {
				expect(result).toHaveLength(1);
				expect(result[0]?.name).toBe("Concurrent Test Event");
			}
		});

		it("should handle different users concurrently", async () => {
			const users = Array.from({ length: 5 }, (_, i) => ({
				...mockUser,
				id: `user-${i}`,
				name: `User ${i}`,
			})) as UserType[];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue([
				{
					id: "attendance-1",
					event: { id: "shared-event", name: "Shared Event" },
					recurringEventInstance: null,
				},
			]);

			const concurrentUserCalls = users.map((user) =>
				userEventsAttendedResolver(user, {}, ctx),
			);

			const results = await Promise.all(concurrentUserCalls);

			for (const result of results) {
				expect(result).toHaveLength(1);
				expect(result[0]?.name).toBe("Shared Event");
			}
		});
	});
});
