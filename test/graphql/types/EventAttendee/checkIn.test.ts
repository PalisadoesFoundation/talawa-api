import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeCheckInResolver } from "~/src/graphql/types/EventAttendee/checkIn";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("EventAttendee CheckIn Resolver Tests", () => {
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
			checkInId: "checkin-789",
			checkOutId: null,
			isInvited: true,
			isRegistered: true,
			isCheckedIn: true,
			isCheckedOut: false,
			createdAt: new Date("2024-03-10T08:00:00Z"),
		} as EventAttendeeType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeCheckInResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Null CheckIn ID Handling", () => {
		it("should return null when checkInId is null", async () => {
			const attendeeWithoutCheckIn = {
				...mockEventAttendee,
				checkInId: null,
			} as EventAttendeeType;

			const result = await eventAttendeeCheckInResolver(
				attendeeWithoutCheckIn,
				{},
				ctx,
			);

			expect(result).toBeNull();
			// Should not query database when checkInId is null
			expect(
				mocks.drizzleClient.query.checkInsTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should handle attendee who hasn't checked in yet", async () => {
			const newAttendee = {
				...mockEventAttendee,
				checkInId: null,
				isCheckedIn: false,
			} as EventAttendeeType;

			const result = await eventAttendeeCheckInResolver(newAttendee, {}, ctx);
			expect(result).toBeNull();
		});
	});

	describe("CheckIn Resolution", () => {
		it("should successfully resolve check-in record", async () => {
			const mockCheckIn = {
				id: "checkin-789",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:00:00Z"),
				feedbackSubmitted: false,
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				mockCheckIn,
			);

			const result = await eventAttendeeCheckInResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual(mockCheckIn);
			expect(
				mocks.drizzleClient.query.checkInsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // The eq() function result
			});
		});

		it("should throw unexpected error if check-in record is not found", async () => {
			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeCheckInResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's check-in id that isn't null.",
			);
		});

		it("should handle database error when fetching check-in", async () => {
			mocks.drizzleClient.query.checkInsTable.findFirst.mockRejectedValue(
				new Error("Database connection timeout"),
			);

			await expect(
				eventAttendeeCheckInResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Database connection timeout");
		});
	});

	describe("Data Consistency Tests", () => {
		it("should handle orphaned check-in records", async () => {
			// Check-in exists but references wrong attendee
			const orphanedCheckIn = {
				id: "checkin-789",
				eventAttendeeId: "different-attendee-999",
				time: new Date("2024-03-10T10:00:00Z"),
				feedbackSubmitted: true,
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				orphanedCheckIn,
			);

			const result = await eventAttendeeCheckInResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			// Should still return the check-in (business logic decision)
			expect(result).toEqual(orphanedCheckIn);
		});

		it("should handle check-in with feedback submitted", async () => {
			const checkInWithFeedback = {
				id: "checkin-789",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:00:00Z"),
				feedbackSubmitted: true,
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				checkInWithFeedback,
			);

			const result = await eventAttendeeCheckInResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(checkInWithFeedback);
		});

		it("should handle multiple check-ins for same attendee", async () => {
			// This shouldn't happen in normal flow, but test data consistency
			const multipleCheckInAttendee = {
				...mockEventAttendee,
				checkInId: "latest-checkin-999",
			} as EventAttendeeType;

			const latestCheckIn = {
				id: "latest-checkin-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T11:00:00Z"),
				feedbackSubmitted: false,
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				latestCheckIn,
			);

			const result = await eventAttendeeCheckInResolver(
				multipleCheckInAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(latestCheckIn);
		});
	});

	describe("Performance Tests", () => {
		it("should handle rapid successive calls efficiently", async () => {
			const mockCheckIn = {
				id: "checkin-789",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:00:00Z"),
				feedbackSubmitted: false,
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				mockCheckIn,
			);

			// Make 15 rapid calls
			const rapidCalls = Array.from({ length: 15 }, (_, i) =>
				eventAttendeeCheckInResolver(
					{ ...mockEventAttendee, id: `attendee-${i}` } as EventAttendeeType,
					{},
					ctx,
				),
			);

			const results = await Promise.all(rapidCalls);

			for (const result of results) {
				expect(result).toEqual(mockCheckIn);
			}
		});

		it("should complete within performance threshold", async () => {
			const mockCheckIn = {
				id: "checkin-789",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:00:00Z"),
			};

			mocks.drizzleClient.query.checkInsTable.findFirst.mockResolvedValue(
				mockCheckIn,
			);

			const startTime = Date.now();
			const result = await eventAttendeeCheckInResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			const endTime = Date.now();

			expect(result).toEqual(mockCheckIn);
			expect(endTime - startTime).toBeLessThan(50); // Very fast operation
		});
	});

	describe("Error Recovery", () => {
		it("should handle intermittent database failures", async () => {
			// First call fails, second succeeds
			mocks.drizzleClient.query.checkInsTable.findFirst
				.mockRejectedValueOnce(new Error("Temporary connection lost"))
				.mockResolvedValueOnce({
					id: "checkin-789",
					time: new Date(),
				});

			// First call should fail
			await expect(
				eventAttendeeCheckInResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Temporary connection lost");

			// Second call should succeed
			const result = await eventAttendeeCheckInResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toBeDefined();
		});
	});
});
