import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeCheckOutResolver } from "~/src/graphql/types/EventAttendee/checkOut";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("EventAttendee CheckOut Resolver Tests", () => {
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
			checkInId: "checkin-789",
			checkOutId: "checkout-999",
			isInvited: true,
			isRegistered: true,
			isCheckedIn: true,
			isCheckedOut: true,
			createdAt: new Date("2024-03-10T08:00:00Z"),
			updatedAt: new Date("2024-03-10T18:00:00Z"),
		} as EventAttendeeType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeCheckOutResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Null CheckOut ID Handling", () => {
		it("should return null when checkOutId is null", async () => {
			const attendeeWithoutCheckOut = {
				...mockEventAttendee,
				checkOutId: null,
				isCheckedOut: false,
			} as EventAttendeeType;

			const result = await eventAttendeeCheckOutResolver(
				attendeeWithoutCheckOut,
				{},
				ctx,
			);

			expect(result).toBeNull();
			// Should not query database when checkOutId is null
			expect(
				mocks.drizzleClient.query.checkOutsTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should handle attendee who is still at the event", async () => {
			const currentAttendee = {
				...mockEventAttendee,
				checkOutId: null,
				isCheckedIn: true,
				isCheckedOut: false,
			} as EventAttendeeType;

			const result = await eventAttendeeCheckOutResolver(
				currentAttendee,
				{},
				ctx,
			);
			expect(result).toBeNull();
		});
	});

	describe("CheckOut Resolution", () => {
		it("should successfully resolve check-out record", async () => {
			const mockCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T18:00:00Z"),
				createdAt: new Date("2024-03-10T18:00:00Z"),
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				mockCheckOut,
			);

			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual(mockCheckOut);
			expect(
				mocks.drizzleClient.query.checkOutsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // The eq() function result
			});
		});

		it("should throw unexpected error if check-out record is not found", async () => {
			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeCheckOutResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's check-out id that isn't null.",
			);
		});

		it("should handle database error when fetching check-out", async () => {
			mocks.drizzleClient.query.checkOutsTable.findFirst.mockRejectedValue(
				new Error("Database connection lost"),
			);

			await expect(
				eventAttendeeCheckOutResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Database connection lost");
		});
	});

	describe("Business Logic Tests", () => {
		it("should handle attendee with multiple check-out attempts", async () => {
			// Test edge case where attendee might have multiple checkout records
			const latestCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T19:30:00Z"), // Later checkout
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				latestCheckOut,
			);

			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(latestCheckOut);
		});

		it("should handle early check-out scenarios", async () => {
			const earlyCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:30:00Z"), // Check-out 30 min after check-in
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				earlyCheckOut,
			);

			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(earlyCheckOut);
		});

		it("should handle same-time check-in/check-out", async () => {
			const sameTimeCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T10:00:00Z"), // Same time as check-in
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				sameTimeCheckOut,
			);

			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(sameTimeCheckOut);
		});
	});

	describe("Data Integrity Tests", () => {
		it("should handle orphaned check-out records", async () => {
			// Check-out exists but references wrong attendee
			const orphanedCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "different-attendee-888",
				time: new Date("2024-03-10T18:00:00Z"),
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				orphanedCheckOut,
			);

			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			// Should still return the check-out (database query by ID succeeded)
			expect(result).toEqual(orphanedCheckOut);
		});

		it("should handle malformed checkOutId", async () => {
			const malformedAttendee = {
				...mockEventAttendee,
				checkOutId: "invalid-uuid-format",
			} as EventAttendeeType;

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockRejectedValue(
				new Error("Invalid UUID format"),
			);

			await expect(
				eventAttendeeCheckOutResolver(malformedAttendee, {}, ctx),
			).rejects.toThrow("Invalid UUID format");
		});
	});

	describe("Performance Tests", () => {
		it("should handle concurrent check-out resolutions", async () => {
			const mockCheckOut = {
				id: "checkout-999",
				eventAttendeeId: "attendee-123",
				time: new Date("2024-03-10T18:00:00Z"),
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				mockCheckOut,
			);

			// Run multiple concurrent calls
			const concurrentCalls = Array.from({ length: 8 }, () =>
				eventAttendeeCheckOutResolver(mockEventAttendee, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			for (const result of results) {
				expect(result).toEqual(mockCheckOut);
			}
		});

		it("should complete within acceptable time", async () => {
			const mockCheckOut = {
				id: "checkout-999",
				time: new Date("2024-03-10T18:00:00Z"),
			};

			mocks.drizzleClient.query.checkOutsTable.findFirst.mockResolvedValue(
				mockCheckOut,
			);

			const startTime = Date.now();
			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			const endTime = Date.now();

			expect(result).toEqual(mockCheckOut);
			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe("Recovery Scenarios", () => {
		it("should handle database recovery after failure", async () => {
			// First call fails, second succeeds
			mocks.drizzleClient.query.checkOutsTable.findFirst
				.mockRejectedValueOnce(new Error("Database temporarily unavailable"))
				.mockResolvedValueOnce({
					id: "checkout-999",
					time: new Date("2024-03-10T18:00:00Z"),
				});

			// First call should fail
			await expect(
				eventAttendeeCheckOutResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Database temporarily unavailable");

			// Second call should succeed
			const result = await eventAttendeeCheckOutResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toBeDefined();
			expect(result?.id).toBe("checkout-999");
		});
	});
});
