import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeEventResolver } from "~/src/graphql/types/EventAttendee/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("EventAttendee Event Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEventAttendee: EventAttendeeType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockEventAttendee = {
			id: "attendee-123",
			userId: "user-789",
			eventId: "event-456",
			recurringEventInstanceId: null,
			checkinTime: null,
			checkoutTime: null,
			feedbackSubmitted: false,
			isInvited: true,
			isRegistered: true,
			isCheckedIn: false,
			isCheckedOut: false,
			createdAt: new Date("2024-03-10T08:00:00Z"),
			updatedAt: new Date("2024-03-10T08:00:00Z"),
		} as EventAttendeeType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Standalone Event Resolution", () => {
		it("should successfully resolve standalone event", async () => {
			const mockEvent = {
				id: "event-456",
				name: "Test Event",
				description: "Test Description",
				startAt: new Date("2024-03-10T09:00:00Z"),
				endAt: new Date("2024-03-10T12:00:00Z"),
				organizationId: "org-123",
				isPublic: true,
				isRegisterable: true,
				allDay: false,
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...mockEvent,
				attachments: [],
			});
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should throw unexpected error if standalone event is not found", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's event id that isn't null.",
			);
		});

		it("should handle database error when fetching standalone event", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});

	describe("Recurring Event Instance Resolution", () => {
		it("should return null for recurring event instances (TODO implementation)", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			const result = await eventAttendeeEventResolver(
				recurringAttendee,
				{},
				ctx,
			);
			expect(result).toBeNull();
		});

		it("should handle future recurring instance implementation", async () => {
			// This test documents expected behavior once TODO is implemented
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			// Currently returns null, but should eventually resolve recurring instances
			const result = await eventAttendeeEventResolver(
				recurringAttendee,
				{},
				ctx,
			);
			expect(result).toBeNull();

			// No database calls should be made for recurring instances yet
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should return null when neither eventId nor recurringEventInstanceId exists", async () => {
			const invalidAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: null,
			} as EventAttendeeType;

			const result = await eventAttendeeEventResolver(invalidAttendee, {}, ctx);
			expect(result).toBeNull();
		});

		it("should handle malformed eventId gracefully", async () => {
			const malformedAttendee = {
				...mockEventAttendee,
				eventId: "invalid-uuid-format",
			} as EventAttendeeType;

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Invalid UUID format"),
			);

			await expect(
				eventAttendeeEventResolver(malformedAttendee, {}, ctx),
			).rejects.toThrow("Invalid UUID format");
		});

		it("should handle deleted events", async () => {
			// Event was deleted but attendee record remains
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});

	describe("Event Data Handling", () => {
		it("should always include empty attachments array", async () => {
			const eventWithoutAttachments = {
				id: "event-456",
				name: "Simple Event",
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				eventWithoutAttachments,
			);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...eventWithoutAttachments,
				attachments: [],
			});
			expect(result?.attachments).toEqual([]);
		});

		it("should handle events with complete data", async () => {
			const completeEvent = {
				id: "event-456",
				name: "Complete Event",
				description: "Full event description",
				location: "New York Convention Center",
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
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				completeEvent,
			);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...completeEvent,
				attachments: [],
			});
		});

		it("should handle events with minimal data", async () => {
			const minimalEvent = {
				id: "event-456",
				name: "Minimal Event",
				organizationId: "org-123",
				// Most other fields null/undefined
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				minimalEvent,
			);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...minimalEvent,
				attachments: [],
			});
		});
	});

	describe("Performance Tests", () => {
		it("should handle multiple attendees for same event efficiently", async () => {
			const sharedEvent = {
				id: "event-456",
				name: "Popular Event",
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				sharedEvent,
			);

			// Multiple attendees attending same event
			const attendees = Array.from({ length: 12 }, (_, i) => ({
				...mockEventAttendee,
				id: `attendee-${i}`,
				userId: `user-${i}`,
			})) as EventAttendeeType[];

			const startTime = Date.now();
			const results = await Promise.all(
				attendees.map((attendee) =>
					eventAttendeeEventResolver(attendee, {}, ctx),
				),
			);
			const endTime = Date.now();

			expect(results).toHaveLength(12);
			for (const result of results) {
				expect(result).toEqual({
					...sharedEvent,
					attachments: [],
				});
			}

			// Should handle bulk operations efficiently
			expect(endTime - startTime).toBeLessThan(200);
		});

		it("should handle large event data without performance degradation", async () => {
			const largeEvent = {
				id: "event-456",
				name: "Large Event with Very Long Name ".repeat(50),
				description: "Large description ".repeat(200),
				location: "Large location data ".repeat(10),
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				largeEvent,
			);

			const startTime = Date.now();
			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			const endTime = Date.now();

			expect(result).toEqual({
				...largeEvent,
				attachments: [],
			});
			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe("Database Recovery Scenarios", () => {
		it("should handle transient database failures", async () => {
			// First call fails, second succeeds
			mocks.drizzleClient.query.eventsTable.findFirst
				.mockRejectedValueOnce(new Error("Transient database error"))
				.mockResolvedValueOnce({
					id: "event-456",
					name: "Recovery Test Event",
					organizationId: "org-123",
				});

			// First call should fail
			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Transient database error");

			// Second call should succeed
			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toBeDefined();
			expect(result?.id).toBe("event-456");
		});

		it("should handle database rollback scenarios", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Transaction was rolled back"),
			);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Transaction was rolled back");
		});
	});
});
