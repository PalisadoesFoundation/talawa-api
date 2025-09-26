import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { CheckIn as CheckInType } from "~/src/graphql/types/CheckIn/CheckIn";
import { checkInUserResolver } from "~/src/graphql/types/CheckIn/user";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("CheckIn User Resolver Tests", () => {
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

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Event Attendee Resolution", () => {
		it("should throw unexpected error if event attendee is not found", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a check-in's event attendee id that isn't null.",
			);
		});

		it("should handle database error when fetching event attendee", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Database connection lost"),
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"Database connection lost",
			);
		});
	});

	describe("User Resolution", () => {
		it("should successfully resolve user from event attendee", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockUser = {
				id: "user-789",
				name: "John Doe",
				emailAddress: "john@example.com",
				role: "regular",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await checkInUserResolver(mockCheckIn, {}, ctx);

			expect(result).toEqual(mockUser);
		});

		it("should throw unexpected error if user is not found", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's user id that isn't null.",
			);
		});

		it("should handle database error when fetching user", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("User table locked"),
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				"User table locked",
			);
		});
	});

	describe("Complex Scenarios", () => {
		it("should handle data consistency issues between attendee and user", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			// Simulate scenario where attendee references a user that doesn't exist
			// This tests data integrity validation
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's user id that isn't null.",
			);
		});

		it("should handle cascaded deletion scenarios", async () => {
			// Test case where user was deleted but check-in records remain
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				{
					id: "attendee-456",
					userId: "deleted-user-id",
					eventId: "event-123",
				},
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(checkInUserResolver(mockCheckIn, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});

	describe("Stress Testing", () => {
		it("should handle resolver with different user types", async () => {
			const userTypes = [
				{ id: "admin-123", role: "administrator" },
				{ id: "regular-456", role: "regular" },
				{ id: "moderator-789", role: "moderator" },
			];

			for (const userType of userTypes) {
				const mockEventAttendee = {
					id: "attendee-456",
					userId: userType.id,
					eventId: "event-123",
				};

				mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
					mockEventAttendee,
				);
				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
					userType,
				);

				const result = await checkInUserResolver(mockCheckIn, {}, ctx);
				expect(result).toEqual(userType);
			}
		});

		it("should handle rapid successive calls", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
			};

			const mockUser = {
				id: "user-789",
				name: "Test User",
				emailAddress: "test@example.com",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			// Make rapid successive calls
			const calls = Array.from({ length: 20 }, (_, i) =>
				checkInUserResolver(
					{ ...mockCheckIn, id: `checkin-${i}` } as CheckInType,
					{},
					ctx,
				),
			);

			const results = await Promise.all(calls);

			// All should resolve to the same user
			for (const result of results) {
				expect(result).toEqual(mockUser);
			}
		});
	});
});
