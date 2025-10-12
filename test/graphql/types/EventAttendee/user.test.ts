import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeUserResolver } from "~/src/graphql/types/EventAttendee/user";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("EventAttendee User Resolver Tests", () => {
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
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("User Resolution", () => {
		it("should successfully resolve user by userId", async () => {
			const mockUser = {
				id: "user-789",
				name: "John Doe",
				emailAddress: "john@example.com",
				role: "regular",
				natalSex: "male",
				createdAt: new Date("2024-01-01T00:00:00Z"),
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await eventAttendeeUserResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual(mockUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should throw unexpected error if user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event attendee's user id that isn't null.",
			);
		});

		it("should handle database connection errors", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("ECONNRESET"),
			);

			await expect(
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database timeout errors", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Query timeout after 30 seconds"),
			);

			await expect(
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should pass through TalawaGraphQLError without wrapping", async () => {
			const originalError = new TalawaGraphQLError({
				message: "Custom authorization error",
				extensions: { code: "unauthorized_action" },
			});

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				originalError,
			);

			await expect(
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(originalError);

			// Should not double-log TalawaGraphQLErrors
			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should wrap non-TalawaGraphQLError exceptions", async () => {
			const genericError = new Error("Generic database error");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				genericError,
			);

			await expect(
				eventAttendeeUserResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(genericError);
		});
	});

	describe("Data Integrity", () => {
		it("should handle different user types", async () => {
			const userTypes = [
				{ id: "admin-123", role: "administrator" },
				{ id: "regular-456", role: "regular" },
				{ id: "moderator-789", role: "moderator" },
			];

			for (const userType of userTypes) {
				const attendeeForUser = {
					...mockEventAttendee,
					userId: userType.id,
				} as EventAttendeeType;

				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
					userType,
				);

				const result = await eventAttendeeUserResolver(
					attendeeForUser,
					{},
					ctx,
				);
				expect(result).toEqual(userType);
			}
		});

		it("should handle users with complete profile data", async () => {
			const completeUser = {
				id: "user-789",
				name: "John Doe",
				emailAddress: "john@example.com",
				role: "regular",
				natalSex: "male",
				birthDate: new Date("1990-01-15"),
				city: "New York",
				state: "NY",
				countryCode: "US",
				mobilePhoneNumber: "+1234567890",
				workPhoneNumber: "+1987654321",
				homePhoneNumber: "+1555666777",
				addressLine1: "123 Main St",
				addressLine2: "Apt 4B",
				postalCode: "10001",
				description: "Event coordinator",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				completeUser,
			);

			const result = await eventAttendeeUserResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(completeUser);
		});

		it("should handle users with minimal profile data", async () => {
			const minimalUser = {
				id: "user-789",
				name: "Jane Smith",
				emailAddress: "jane@example.com",
				role: "regular",
				// Most other fields null/undefined
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				minimalUser,
			);

			const result = await eventAttendeeUserResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(minimalUser);
		});
	});

	describe("Performance Benchmarks", () => {
		it("should handle bulk user resolution efficiently", async () => {
			const mockUser = {
				id: "user-789",
				name: "Performance Test User",
				emailAddress: "perf@test.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const bulkAttendees = Array.from(
				{ length: 25 },
				(_, i) =>
					({
						...mockEventAttendee,
						id: `attendee-${i}`,
						userId: `user-${i}`,
					}) as EventAttendeeType,
			);

			const startTime = Date.now();
			const results = await Promise.all(
				bulkAttendees.map((attendee) =>
					eventAttendeeUserResolver(attendee, {}, ctx),
				),
			);
			const endTime = Date.now();

			expect(results).toHaveLength(25);
			for (const result of results) {
				expect(result).toEqual(mockUser);
			}

			// Should handle bulk operations efficiently
			expect(endTime - startTime).toBeLessThan(500);
		});
	});
});
