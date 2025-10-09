import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { CheckIn as CheckInType } from "~/src/graphql/types/CheckIn/CheckIn";
import { checkInEventAttendeeResolver } from "~/src/graphql/types/CheckIn/eventAttendee";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("CheckIn EventAttendee Resolver Tests", () => {
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

			await expect(
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Event Attendee Resolution", () => {
		it("should successfully resolve event attendee", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
				isInvited: true,
				isRegistered: true,
				isCheckedIn: true,
				isCheckedOut: false,
				createdAt: new Date("2024-03-10T08:00:00Z"),
				updatedAt: new Date("2024-03-10T09:00:00Z"),
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			const result = await checkInEventAttendeeResolver(mockCheckIn, {}, ctx);

			expect(result).toEqual(mockEventAttendee);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Object), // The eq() function result
			});
		});

		it("should throw unexpected error if event attendee is not found", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a check-in's event attendee id that isn't null.",
			);
		});

		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("ECONNREFUSED: Connection refused"),
			);

			await expect(
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			).rejects.toThrow("ECONNREFUSED: Connection refused");
		});

		it("should handle database timeout error", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Query timeout after 30s"),
			);

			await expect(
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			).rejects.toThrow("Query timeout after 30s");
		});
	});

	describe("Data Integrity Tests", () => {
		it("should handle malformed eventAttendeeId in check-in", async () => {
			const malformedCheckIn = {
				...mockCheckIn,
				eventAttendeeId: "invalid-uuid-format",
			} as CheckInType;

			// Database should reject invalid UUID format
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Invalid UUID format"),
			);

			await expect(
				checkInEventAttendeeResolver(malformedCheckIn, {}, ctx),
			).rejects.toThrow("Invalid UUID format");
		});

		it("should handle null eventAttendeeId gracefully", async () => {
			const nullAttendeeCheckIn: Omit<CheckInType, "eventAttendeeId"> & {
				eventAttendeeId: null;
			} = {
				...mockCheckIn,
				eventAttendeeId: null,
			};

			// This should cause a database error due to constraint violation
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Cannot query with null eventAttendeeId"),
			);

			await expect(
				checkInEventAttendeeResolver(
					nullAttendeeCheckIn as unknown as CheckInType,
					{},
					ctx,
				),
			).rejects.toThrow("Cannot query with null eventAttendeeId");
		});

		it("should handle soft-deleted event attendee records", async () => {
			// Simulate scenario where attendee record exists but is soft-deleted
			const softDeletedAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				isDeleted: true, // Hypothetical soft delete flag
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				softDeletedAttendee,
			);

			const result = await checkInEventAttendeeResolver(mockCheckIn, {}, ctx);

			// Should still return the attendee record (business logic decision)
			expect(result).toEqual(softDeletedAttendee);
		});
	});

	describe("Concurrency and Race Conditions", () => {
		it("should handle concurrent check-ins for same attendee", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				isCheckedIn: true,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			// Simulate multiple concurrent resolver calls
			const concurrentCalls = Array.from({ length: 5 }, () =>
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			// All calls should return the same attendee
			for (const result of results) {
				expect(result).toEqual(mockEventAttendee);
			}
		});

		it("should handle attendee record modification during resolution", async () => {
			// First call returns attendee, second returns undefined (simulating deletion)
			mocks.drizzleClient.query.eventAttendeesTable.findFirst
				.mockResolvedValueOnce({
					id: "attendee-456",
					userId: "user-789",
					eventId: "event-123",
				})
				.mockResolvedValueOnce(undefined);

			// First call should succeed
			const firstResult = await checkInEventAttendeeResolver(
				mockCheckIn,
				{},
				ctx,
			);
			expect(firstResult).toBeDefined();

			// Second call should fail
			await expect(
				checkInEventAttendeeResolver(mockCheckIn, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});

	describe("Performance Testing", () => {
		it("should complete within reasonable time limits", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			const startTime = Date.now();
			const result = await checkInEventAttendeeResolver(mockCheckIn, {}, ctx);
			const endTime = Date.now();

			expect(result).toEqual(mockEventAttendee);
			expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
		});

		it("should handle large attendee datasets efficiently", async () => {
			// Create attendee with large nested data
			const largeEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				largeData: "x".repeat(10000), // 10KB of data
				metadata: Array.from({ length: 1000 }, (_, i) => ({
					key: `metadata-${i}`,
					value: `value-${i}`,
				})),
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				largeEventAttendee,
			);

			const result = await checkInEventAttendeeResolver(mockCheckIn, {}, ctx);
			expect(result).toEqual(largeEventAttendee);
		});
	});
});
