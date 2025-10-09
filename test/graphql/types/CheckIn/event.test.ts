import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { CheckIn as CheckInType } from "~/src/graphql/types/CheckIn/CheckIn";
import { checkInEventResolver } from "~/src/graphql/types/CheckIn/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("CheckIn Event Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockCheckIn: CheckInType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockCheckIn = {
			id: "checkin-123",
			eventAttendeeId: "attendee-456",
			time: new Date("2024-03-10T10:00:00Z"),
			feedbackSubmitted: false,
		} as CheckInType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Event Attendee Resolution", () => {
		it("should throw unexpected error if event attendee is not found", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a check-in's event attendee id that isn't null.",
			);
		});

		it("should handle database error when fetching event attendee", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Database connection failed",
			);
		});
	});

	describe("Standalone Event Resolution", () => {
		it("should successfully resolve standalone event", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
				isInvited: true,
				isRegistered: true,
				isCheckedIn: true,
				isCheckedOut: false,
			};

			const mockEvent = {
				id: "event-123",
				name: "Test Event",
				description: "Test Description",
				startAt: new Date("2024-03-10T09:00:00Z"),
				endAt: new Date("2024-03-10T12:00:00Z"),
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await checkInEventResolver(mockCheckIn, {}, ctx);

			expect(result).toEqual({
				...mockEvent,
				attachments: [],
			});
		});

		it("should throw unexpected error if standalone event is not found", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's event id that isn't null.",
			);
		});

		it("should handle database error when fetching standalone event", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Database timeout"),
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Database timeout",
			);
		});
	});

	describe("Recurring Event Instance Resolution", () => {
		it("should return null for recurring event instances (TODO implementation)", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: "instance-789",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			const result = await checkInEventResolver(mockCheckIn, {}, ctx);
			expect(result).toBeNull();
		});
	});

	describe("Edge Cases", () => {
		it("should return null when neither eventId nor recurringEventInstanceId exists", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			const result = await checkInEventResolver(mockCheckIn, {}, ctx);
			expect(result).toBeNull();
		});

		it("should handle malformed check-in data gracefully", async () => {
			const malformedCheckIn: Omit<CheckInType, "eventAttendeeId"> & {
				eventAttendeeId: null;
			} = {
				...mockCheckIn,
				eventAttendeeId: null,
			};

			// This should cause a database error when trying to query with null
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Invalid query parameter"),
			);

			await expect(
				checkInEventResolver(
					malformedCheckIn as unknown as CheckInType,
					{},
					ctx,
				),
			).rejects.toThrow("Invalid query parameter");
		});
	});

	describe("Database Transaction Edge Cases", () => {
		it("should handle transaction rollback scenarios", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Transaction was rolled back"),
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Transaction was rolled back",
			);
		});

		it("should handle connection pool exhaustion", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Connection pool exhausted"),
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Connection pool exhausted",
			);
		});

		it("should handle query timeout", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Query execution timeout"),
			);

			await expect(checkInEventResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Query execution timeout",
			);
		});
	});

	describe("Performance and Load Testing", () => {
		it("should handle multiple concurrent resolver calls", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = {
				id: "event-123",
				name: "Test Event",
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			// Run multiple resolver calls concurrently
			const promises = Array.from({ length: 10 }, () =>
				checkInEventResolver(mockCheckIn, {}, ctx),
			);

			const results = await Promise.all(promises);

			// All results should be identical
			for (const result of results) {
				expect(result).toEqual({
					...mockEvent,
					attachments: [],
				});
			}
		});

		it("should handle large event data efficiently", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const largeEvent = {
				id: "event-123",
				name: "Large Event with Very Long Name ".repeat(100),
				description: "Large description content ".repeat(500),
				organizationId: "org-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				largeEvent,
			);

			const startTime = Date.now();
			const result = await checkInEventResolver(mockCheckIn, {}, ctx);
			const endTime = Date.now();

			expect(result).toEqual({
				...largeEvent,
				attachments: [],
			});

			// Should complete within reasonable time
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});
});
