import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { CheckOut as CheckOutType } from "~/src/graphql/types/CheckOut/CheckOut";
import { checkOutEventAttendeeResolver } from "~/src/graphql/types/CheckOut/eventAttendee";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("CheckOut EventAttendee Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockCheckOut: CheckOutType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockCheckOut = {
			id: "checkout-123",
			eventAttendeeId: "attendee-456",
			time: new Date("2024-03-10T18:00:00Z"),
			createdAt: new Date("2024-03-10T18:00:00Z"),
		} as CheckOutType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				checkOutEventAttendeeResolver(mockCheckOut, {}, ctx),
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
				isRegistered: true,
				isCheckedIn: true,
				isCheckedOut: true,
				createdAt: new Date("2024-03-10T08:00:00Z"),
				updatedAt: new Date("2024-03-10T17:30:00Z"),
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);

			expect(result).toEqual(mockEventAttendee);
			expect(
				mocks.drizzleClient.query.eventAttendeesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should throw unexpected error if event attendee is not found", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkOutEventAttendeeResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a check-out's event attendee id that isn't null.",
			);
		});

		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				checkOutEventAttendeeResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});

	describe("Data Integrity Tests", () => {
		it("should handle malformed eventAttendeeId", async () => {
			const malformedCheckOut = {
				...mockCheckOut,
				eventAttendeeId: "invalid-uuid",
			} as CheckOutType;

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Invalid UUID format"),
			);

			await expect(
				checkOutEventAttendeeResolver(malformedCheckOut, {}, ctx),
			).rejects.toThrow("Invalid UUID format");
		});

		it("should handle attendee who checked out without checking in", async () => {
			const attendeeWithoutCheckIn = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				isCheckedIn: false,
				isCheckedOut: true, // This is unusual but possible
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				attendeeWithoutCheckIn,
			);

			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(attendeeWithoutCheckIn);
		});

		it("should handle recurring event instance attendees", async () => {
			const recurringAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: "instance-789",
				isRegistered: true,
				isCheckedOut: true,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				recurringAttendee,
			);

			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(recurringAttendee);
		});
	});

	describe("Performance and Edge Cases", () => {
		it("should handle multiple concurrent checkout resolutions", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			// Run multiple concurrent resolver calls
			const concurrentCalls = Array.from({ length: 10 }, () =>
				checkOutEventAttendeeResolver(mockCheckOut, {}, ctx),
			);

			const results = await Promise.all(concurrentCalls);

			for (const result of results) {
				expect(result).toEqual(mockEventAttendee);
			}
		});

		it("should handle large attendee data efficiently", async () => {
			const largeAttendeeData = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				metadata: "x".repeat(5000), // 5KB of metadata
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				largeAttendeeData,
			);

			const startTime = Date.now();
			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);
			const endTime = Date.now();

			expect(result).toEqual(largeAttendeeData);
			expect(endTime - startTime).toBeLessThan(100); // Should be fast
		});

		it("should handle database timeout scenarios", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Query timeout after 30 seconds"),
			);

			await expect(
				checkOutEventAttendeeResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow("Query timeout after 30 seconds");
		});
	});

	describe("Business Logic Edge Cases", () => {
		it("should handle attendee from different events", async () => {
			const crossEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "different-event-123",
				isCheckedOut: true,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				crossEventAttendee,
			);

			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(crossEventAttendee);
		});

		it("should handle soft-deleted attendee records", async () => {
			const softDeletedAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				isDeleted: true,
				isCheckedOut: true,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				softDeletedAttendee,
			);

			const result = await checkOutEventAttendeeResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(softDeletedAttendee);
		});
	});
});
