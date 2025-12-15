import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerUserResolver } from "~/src/graphql/types/EventVolunteer/user";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteer
const mockEventVolunteer = {
	id: "volunteer-123",
	userId: "user-123",
	eventId: "event-123",
	creatorId: "creator-123",
	hasAccepted: true,
	isPublic: true,
	hoursVolunteered: "5.50",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	updaterId: "updater-123",
	recurringEventInstanceId: null,
	isTemplate: false,
};

const mockVolunteerUser = {
	id: "user-123",
	name: "John Volunteer",
	emailAddress: "volunteer@example.com",
	role: "member",
	createdAt: new Date("2024-01-01T08:00:00Z"),
	updatedAt: new Date("2024-01-01T08:00:00Z"),
	addressLine1: null,
	addressLine2: null,
	birthDate: null,
	city: null,
	countryCode: null,
	description: null,
	educationGrade: null,
	employmentStatus: null,
	homePhoneNumber: null,
	isEmailAddressVerified: true,
	maritalStatus: null,
	mobilePhoneNumber: null,
	natalSex: null,
	postalCode: null,
	state: null,
	workPhoneNumber: null,
	updaterId: null,
};

describe("EventVolunteerUserResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerUserResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerUserResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("User Retrieval", () => {
		it("should return volunteer user when userId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockVolunteerUser,
			);

			const result = await EventVolunteerUserResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when user is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				EventVolunteerUserResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerUserResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer's user id that isn't null.",
			);
		});

		it("should query database for volunteer user", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockVolunteerUser,
			);

			await EventVolunteerUserResolver(mockEventVolunteer, {}, context);

			// Verify the query was called once (testing behavior, not internal implementation)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different user IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentUser = { ...mockVolunteerUser, id: "different-user-456" };
			const volunteerWithDifferentUser = {
				...mockEventVolunteer,
				userId: "different-user-456",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentUser,
			);

			const result = await EventVolunteerUserResolver(
				volunteerWithDifferentUser,
				{},
				context,
			);

			expect(result).toEqual(differentUser);
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				EventVolunteerUserResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});
	});
});
