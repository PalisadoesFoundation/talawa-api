import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { eventAttendeesResolver } from "~/src/graphql/types/Event/attendees";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Event Attendees Resolver Tests", () => {
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
			createdAt: new Date("2024-03-01T00:00:00Z"),
			creatorId: "user-123",
			updatedAt: null,
			updaterId: null,
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: null,
			isRecurringEventTemplate: false,
			attachmentsPolicy: "inherit",
			recurrenceRule: null,
			recurrenceUntil: null,
			timezone: "UTC",
			attachments: [],
		} as EventType;
	});

	describe("Recurring Event Template Handling", () => {
		it("should return empty array for recurring event templates", async () => {
			const templateEvent = {
				...mockEvent,
				isRecurringEventTemplate: true,
			} as EventType;

			const result = await eventAttendeesResolver(templateEvent, {}, ctx);

			expect(result).toEqual([]);
			// Should not query database for templates
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).not.toHaveBeenCalled();
		});

		it("should handle standalone events normally", async () => {
			const standaloneEvent = {
				...mockEvent,
				isRecurringEventTemplate: false,
			} as EventType;

			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: {
						id: "user-1",
						name: "John Doe",
						emailAddress: "john@example.com",
						role: "regular",
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			const result = await eventAttendeesResolver(standaloneEvent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				...mockAttendees[0]?.user,
				createdAt: mockAttendees[0]?.createdAt, // Should use registration date
			});
		});
	});

	describe("Attendee Resolution", () => {
		it("should return empty array when no attendees exist", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				[],
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // or() function result
				with: {
					user: true,
				},
			});
		});

		it("should resolve multiple attendees correctly", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: {
						id: "user-1",
						name: "John Doe",
						emailAddress: "john@example.com",
						role: "regular",
						natalSex: "male",
					},
				},
				{
					id: "attendee-2",
					userId: "user-2",
					eventId: "event-456",
					createdAt: new Date("2024-03-09T11:00:00Z"),
					user: {
						id: "user-2",
						name: "Jane Smith",
						emailAddress: "jane@example.com",
						role: "regular",
						natalSex: "female",
					},
				},
				{
					id: "attendee-3",
					userId: "user-3",
					recurringEventInstanceId: "event-456", // Mixed event types
					createdAt: new Date("2024-03-09T12:00:00Z"),
					user: {
						id: "user-3",
						name: "Bob Wilson",
						emailAddress: "bob@example.com",
						role: "administrator",
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({
				...mockAttendees[0]?.user,
				createdAt: mockAttendees[0]?.createdAt,
			});
			expect(result[1]).toEqual({
				...mockAttendees[1]?.user,
				createdAt: mockAttendees[1]?.createdAt,
			});
			expect(result[2]).toEqual({
				...mockAttendees[2]?.user,
				createdAt: mockAttendees[2]?.createdAt,
			});
		});

		it("should use EventAttendee registration date, not User creation date", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date("2024-03-09T15:30:00Z"), // Registration date
					user: {
						id: "user-1",
						name: "John Doe",
						emailAddress: "john@example.com",
						createdAt: new Date("2023-01-01T00:00:00Z"), // Much earlier user creation
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.createdAt).toEqual(new Date("2024-03-09T15:30:00Z"));
			expect(result[0]?.createdAt).not.toEqual(
				new Date("2023-01-01T00:00:00Z"),
			);
		});
	});

	describe("Error Handling", () => {
		it("should wrap generic database errors", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(eventAttendeesResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database timeout errors", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				new Error("Query timeout after 30 seconds"),
			);

			await expect(eventAttendeesResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database constraint violations", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockRejectedValue(
				new Error("Foreign key constraint violation"),
			);

			await expect(eventAttendeesResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});
	});

	describe("Event Type Handling", () => {
		it("should handle standalone events", async () => {
			const standaloneAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					recurringEventInstanceId: null,
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: {
						id: "user-1",
						name: "John Doe",
						emailAddress: "john@example.com",
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				standaloneAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("user-1");
		});

		it("should handle recurring event instances", async () => {
			const recurringAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: null,
					recurringEventInstanceId: "event-456",
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: {
						id: "user-1",
						name: "Jane Smith",
						emailAddress: "jane@example.com",
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				recurringAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("user-1");
		});

		it("should handle mixed event types in single query", async () => {
			const mixedAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456", // Standalone
					recurringEventInstanceId: null,
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: { id: "user-1", name: "John Doe" },
				},
				{
					id: "attendee-2",
					userId: "user-2",
					eventId: null,
					recurringEventInstanceId: "event-456", // Recurring instance
					createdAt: new Date("2024-03-09T11:00:00Z"),
					user: { id: "user-2", name: "Jane Smith" },
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mixedAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(2);
			expect(result.map((u) => u.id)).toEqual(["user-1", "user-2"]);
		});
	});

	describe("Performance Tests", () => {
		it("should handle large attendee lists efficiently", async () => {
			const largeAttendeeList = Array.from({ length: 100 }, (_, i) => ({
				id: `attendee-${i}`,
				userId: `user-${i}`,
				eventId: "event-456",
				createdAt: new Date(
					`2024-03-09T${String(i % 24).padStart(2, "0")}:00:00Z`,
				),
				user: {
					id: `user-${i}`,
					name: `User ${i}`,
					emailAddress: `user${i}@example.com`,
					role: "regular",
				},
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				largeAttendeeList,
			);

			const startTime = Date.now();
			const result = await eventAttendeesResolver(mockEvent, {}, ctx);
			const endTime = Date.now();

			expect(result).toHaveLength(100);
			expect(endTime - startTime).toBeLessThan(300); // Should handle 100 attendees quickly
		});

		it("should handle concurrent resolver calls", async () => {
			const mockAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date(),
					user: { id: "user-1", name: "Test User" },
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mockAttendees,
			);

			// Multiple concurrent calls for same event
			const concurrentCalls = Array.from({ length: 8 }, () =>
				eventAttendeesResolver(mockEvent, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			for (const result of results) {
				expect(result).toHaveLength(1);
				expect(result[0]?.id).toBe("user-1");
			}
		});
	});

	describe("Data Consistency", () => {
		it("should handle attendees with missing user data", async () => {
			const attendeesWithMissingUser = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date(),
					user: null, // Missing user data
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				attendeesWithMissingUser as unknown as Awaited<
					ReturnType<
						typeof mocks.drizzleClient.query.eventAttendeesTable.findMany
					>
				>,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			// Should handle gracefully - map will include null user data
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				createdAt: attendeesWithMissingUser[0]?.createdAt,
			});
		});

		it("should preserve all user properties", async () => {
			const attendeesWithCompleteData = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456",
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: {
						id: "user-1",
						name: "John Doe",
						emailAddress: "john@example.com",
						role: "regular",
						natalSex: "male",
						birthDate: new Date("1990-01-15"),
						city: "New York",
						state: "NY",
						countryCode: "US",
						mobilePhoneNumber: "+1234567890",
						avatarURL: "https://example.com/avatar.jpg",
					},
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				attendeesWithCompleteData,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				...attendeesWithCompleteData[0]?.user,
				createdAt: attendeesWithCompleteData[0]?.createdAt,
			});

			// Verify all properties are preserved
			expect(result[0]?.name).toBe("John Doe");
			expect(result[0]?.natalSex).toBe("male");
			expect(result[0]?.mobilePhoneNumber).toBe("+1234567890");
		});
	});

	describe("Query Logic", () => {
		it("should query both standalone and recurring event attendees", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				[],
			);

			await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // or() with both eq() conditions
				with: {
					user: true,
				},
			});
		});

		it("should handle different event types in same result set", async () => {
			const mixedAttendees = [
				{
					id: "attendee-1",
					userId: "user-1",
					eventId: "event-456", // Standalone event
					recurringEventInstanceId: null,
					createdAt: new Date("2024-03-09T10:00:00Z"),
					user: { id: "user-1", name: "Standalone Attendee" },
				},
				{
					id: "attendee-2",
					userId: "user-2",
					eventId: null,
					recurringEventInstanceId: "event-456", // Recurring instance
					createdAt: new Date("2024-03-09T11:00:00Z"),
					user: { id: "user-2", name: "Recurring Attendee" },
				},
			];

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				mixedAttendees,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(2);
			expect(result[0]?.name).toBe("Standalone Attendee");
			expect(result[1]?.name).toBe("Recurring Attendee");
		});
	});

	describe("Stress Testing", () => {
		it("should handle popular events with many attendees", async () => {
			// Simulate a popular event with 500 attendees
			const manyAttendees = Array.from({ length: 500 }, (_, i) => ({
				id: `attendee-${i}`,
				userId: `user-${i}`,
				eventId: "event-456",
				createdAt: new Date(
					`2024-03-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
				),
				user: {
					id: `user-${i}`,
					name: `Attendee ${i}`,
					emailAddress: `attendee${i}@example.com`,
					role: i % 10 === 0 ? "administrator" : "regular", // 10% admins
				},
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				manyAttendees,
			);

			const startTime = Date.now();
			const result = await eventAttendeesResolver(mockEvent, {}, ctx);
			const endTime = Date.now();

			expect(result).toHaveLength(500);
			expect(endTime - startTime).toBeLessThan(1000); // Should handle large sets under 1s

			// Verify data integrity for sample entries
			expect(result[0]?.name).toBe("Attendee 0");
			expect(result[499]?.name).toBe("Attendee 499");
		});

		it("should handle memory-efficient processing", async () => {
			// Test with attendees having large profile data
			const attendeesWithLargeData = Array.from({ length: 50 }, (_, i) => ({
				id: `attendee-${i}`,
				userId: `user-${i}`,
				eventId: "event-456",
				createdAt: new Date(),
				user: {
					id: `user-${i}`,
					name: `User ${i}`,
					description: "Large description content ".repeat(100), // Large text field
					largeMetadata: Array.from({ length: 100 }, (_, j) => `metadata-${j}`),
				},
			}));

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				attendeesWithLargeData as unknown as Awaited<
					ReturnType<
						typeof mocks.drizzleClient.query.eventAttendeesTable.findMany
					>
				>,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(50);
			expect(result[0]?.description).toContain("Large description content");
		});
	});

	describe("Edge Case Data Scenarios", () => {
		it("should handle attendees with various registration timestamps", async () => {
			const timestampVariants = [
				new Date("2024-01-01T00:00:00.000Z"), // Start of year
				new Date("2024-02-29T23:59:59.999Z"), // Leap year edge
				new Date("2024-12-31T23:59:59.999Z"), // End of year
				new Date("1970-01-01T00:00:00.000Z"), // Unix epoch
			];

			const attendeesWithVariedTimestamps = timestampVariants.map(
				(timestamp, i) => ({
					id: `attendee-${i}`,
					userId: `user-${i}`,
					eventId: "event-456",
					createdAt: timestamp,
					user: { id: `user-${i}`, name: `User ${i}` },
				}),
			);

			mocks.drizzleClient.query.eventAttendeesTable.findMany.mockResolvedValue(
				attendeesWithVariedTimestamps,
			);

			const result = await eventAttendeesResolver(mockEvent, {}, ctx);

			expect(result).toHaveLength(4);
			timestampVariants.forEach((timestamp, i) => {
				expect(result[i]?.createdAt).toEqual(timestamp);
			});
		});
	});
});
