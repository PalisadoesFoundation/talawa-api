import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { eventAttendeesCheckInStatusResolver } from "~/src/graphql/types/Event/attendeesCheckInStatus";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Event AttendeesCheckInStatus Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEvent: EventType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockEvent = {
			id: "event-456",
			name: "Test Event",
			description: "Test Description",
			startAt: new Date("2024-03-10T09:00:00Z"),
			endAt: new Date("2024-03-10T12:00:00Z"),
			organizationId: "org-123",
			attachments: [],
			createdAt: new Date("2024-03-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "creator-123",
			updaterId: null,
			location: "Test Location",
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			isRecurringEventTemplate: false,
		} as EventType;
	});

	describe("Recurring Event Template Handling", () => {
		it("should return empty array for recurring event templates", async () => {
			const templateEvent = {
				...mockEvent,
				isRecurringEventTemplate: true,
			} as EventType;

			const result = await eventAttendeesCheckInStatusResolver(
				templateEvent,
				{},
				ctx,
			);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).not.toHaveBeenCalled();
		});

		it("should process regular events normally", async () => {
			const regularEvent = {
				...mockEvent,
				isRecurringEventTemplate: false,
			} as EventType;

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				[],
			);

			const result = await eventAttendeesCheckInStatusResolver(
				regularEvent,
				{},
				ctx,
			);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).toHaveBeenCalled();
		});
	});

	describe("Attendee Check-In Status Resolution", () => {
		it("should return empty array when no attendees exist", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				[],
			);

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // or() function result
			});
		});

		it("should resolve attendees without check-in records", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					checkinTime: null, // No check-in
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
				},
			];

			const mockUser = {
				id: "user-1",
				name: "John Doe",
				emailAddress: "john@example.com",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: "attendee-1",
				user: mockUser,
				attendee: mockAttendees[0],
			});
		});

		it("should resolve attendees with check-in records", async () => {
			const checkinTime = new Date("2024-03-10T10:00:00Z");
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: checkinTime,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const mockUser = {
				id: "user-1",
				name: "Jane Smith",
				emailAddress: "jane@example.com",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: "attendee-1",
				user: mockUser,
				attendee: mockAttendees[0],
			});
		});

		it("should resolve multiple attendees with mixed check-in status", async () => {
			const checkinTime1 = new Date("2024-03-10T10:00:00Z");
			const checkinTime3 = new Date("2024-03-10T11:00:00Z");

			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: checkinTime1, // Has check-in
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "attendee-2",
					userId: "user-2",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: null, // No check-in
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
				{
					id: "attendee-3",
					userId: "user-3",
					eventId: null,
					recurringEventInstanceId: "event-456", // Recurring instance
					checkinTime: checkinTime3,
					checkoutTime: null,
					feedbackSubmitted: true,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const mockUsers = [
				{ id: "user-1", name: "User 1" },
				{ id: "user-2", name: "User 2" },
				{ id: "user-3", name: "User 3" },
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			// Mock user queries to return in sequence
			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUsers[0])
				.mockResolvedValueOnce(mockUsers[1])
				.mockResolvedValueOnce(mockUsers[2]);

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({
				id: "attendee-1",
				user: mockUsers[0],
				attendee: mockAttendees[0],
			});
			expect(result[1]).toEqual({
				id: "attendee-2",
				user: mockUsers[1],
				attendee: mockAttendees[1],
			});
			expect(result[2]).toEqual({
				id: "attendee-3",
				user: mockUsers[2],
				attendee: mockAttendees[2],
			});
		});
	});

	describe("Error Handling", () => {
		it("should throw unexpected error if user is not found", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: null,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should pass through TalawaGraphQLError without wrapping", async () => {
			const originalError = new TalawaGraphQLError({
				message: "Custom error",
				extensions: { code: "unauthorized_action" },
			});

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				originalError,
			);

			await expect(
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			).rejects.toThrow(originalError);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should wrap generic errors", async () => {
			const genericError = new Error("Database connection failed");

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				genericError,
			);

			await expect(
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(genericError);
		});

		it("should handle user lookup failures", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: null,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("User lookup failed"),
			);

			await expect(
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});
	});

	describe("Performance Tests", () => {
		it("should handle large attendee lists efficiently", async () => {
			// Create 50 attendees with varying check-in status
			const largeAttendeeList = Array.from({ length: 50 }, (_, i) => ({
				id: `attendee-${i}`,
				userId: `user-${i}`,
				eventId: "event-456",
				recurringEventInstanceId: null,
				checkinTime: i % 3 === 0 ? new Date("2024-03-10T10:00:00Z") : null, // Every 3rd person checked in
				checkoutTime: null,
				feedbackSubmitted: false,
				isInvited: true,
				isRegistered: true,
				isCheckedIn: i % 3 === 0,
				isCheckedOut: false,
				createdAt: new Date(),
				updatedAt: null,
			}));

			const mockUsers = largeAttendeeList.map((_, i) => ({
				id: `user-${i}`,
				name: `User ${i}`,
				emailAddress: `user${i}@example.com`,
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				largeAttendeeList,
			);

			// Mock user lookups in sequence
			let userCallCount = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() => {
				return Promise.resolve(mockUsers[userCallCount++]);
			});

			const startTime = Date.now();
			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);
			const endTime = Date.now();

			expect(result).toHaveLength(50);
			expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2s

			// Verify check-in status distribution
			const checkedInCount = result.filter(
				(status) => status.attendee.checkinTime !== null,
			).length;
			expect(checkedInCount).toBe(17); // Every 3rd attendee (50/3 ≈ 17)
		});

		it("should handle concurrent resolver calls", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: new Date("2024-03-10T10:00:00Z"),
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
			];

			const mockUser = {
				id: "user-1",
				name: "Concurrent Test User",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			// Run concurrent resolver calls
			const concurrentCalls = Array.from({ length: 5 }, () =>
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			for (const result of results) {
				expect(result).toHaveLength(1);
				expect(result[0]?.user.name).toBe("Concurrent Test User");
				expect(result[0]?.attendee.checkinTime).toEqual(
					new Date("2024-03-10T10:00:00Z"),
				);
			}
		});
	});

	describe("Data Consistency", () => {
		it("should handle orphaned attendee records", async () => {
			// Attendee exists but user was deleted
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "deleted-user-123",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: null,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined, // User not found
			);

			await expect(
				eventAttendeesCheckInStatusResolver(mockEvent, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should maintain data integrity with Promise.all", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: new Date("2024-03-10T10:00:00Z"),
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
				{
					id: "attendee-2",
					userId: "user-2",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: null,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
				{
					id: "attendee-3",
					userId: "user-3",
					eventId: "event-456",
					recurringEventInstanceId: null,
					checkinTime: new Date("2024-03-10T11:00:00Z"),
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: true,
					isRegistered: true,
					isCheckedIn: true,
					isCheckedOut: false,
					createdAt: new Date(),
					updatedAt: null,
				},
			];

			// Mock responses in order
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ id: "user-1", name: "User 1" })
				.mockResolvedValueOnce({ id: "user-2", name: "User 2" })
				.mockResolvedValueOnce({ id: "user-3", name: "User 3" });

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toHaveLength(3);
			expect(result[0]?.user.name).toBe("User 1");
			expect(result[0]?.attendee.checkinTime).toEqual(
				new Date("2024-03-10T10:00:00Z"),
			);
			expect(result[1]?.user.name).toBe("User 2");
			expect(result[1]?.attendee.checkinTime).toBeNull();
			expect(result[2]?.user.name).toBe("User 3");
			expect(result[2]?.attendee.checkinTime).toEqual(
				new Date("2024-03-10T11:00:00Z"),
			);
		});
	});

	describe("Stress Testing", () => {
		it("should handle high check-in activity events", async () => {
			// Event with 80% check-in rate
			const highActivityAttendees = Array.from({ length: 30 }, (_, i) => ({
				id: `attendee-${i}`,
				userId: `user-${i}`,
				eventId: "event-456",
				recurringEventInstanceId: null,
				checkinTime: i < 24 ? new Date("2024-03-10T10:00:00Z") : null, // 24/30 = 80% checked in
				checkoutTime: null,
				feedbackSubmitted: false,
				isInvited: true,
				isRegistered: true,
				isCheckedIn: i < 24,
				isCheckedOut: false,
				createdAt: new Date(),
				updatedAt: null,
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				highActivityAttendees,
			);

			// Mock all user responses
			let userIndex = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() =>
				Promise.resolve({
					id: `user-${userIndex++}`,
					name: `User ${userIndex - 1}`,
				}),
			);

			const result = await eventAttendeesCheckInStatusResolver(
				mockEvent,
				{},
				ctx,
			);

			expect(result).toHaveLength(30);

			const checkedInStatuses = result.filter(
				(status) => status.attendee.checkinTime !== null,
			);
			const notCheckedInStatuses = result.filter(
				(status) => status.attendee.checkinTime === null,
			);

			expect(checkedInStatuses).toHaveLength(24);
			expect(notCheckedInStatuses).toHaveLength(6);
		});
	});
});
