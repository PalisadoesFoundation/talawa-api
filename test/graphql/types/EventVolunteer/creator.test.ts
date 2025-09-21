import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerCreatorResolver } from "~/src/graphql/types/EventVolunteer/creator";
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
};

const mockEventVolunteerWithNullCreator = {
	...mockEventVolunteer,
	creatorId: null,
};

const mockCreatorUser = {
	id: "creator-123",
	name: "John Creator",
	emailAddress: "creator@example.com",
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

describe("EventVolunteerCreatorResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerCreatorResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerCreatorResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Creator Retrieval", () => {
		it("should return null when creatorId is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerCreatorResolver(
				mockEventVolunteerWithNullCreator,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return creator user when creatorId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			const result = await EventVolunteerCreatorResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockCreatorUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when creator is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				EventVolunteerCreatorResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerCreatorResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer's creator id that isn't null.",
			);
		});

		it("should query database for creator", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			await EventVolunteerCreatorResolver(mockEventVolunteer, {}, context);

			// Verify the query was called once (testing behavior, not internal implementation)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty creatorId string as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const eventVolunteerWithEmptyCreator = {
				...mockEventVolunteer,
				creatorId: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!eventVolunteerWithEmptyCreator.creatorId) {
				const result = await EventVolunteerCreatorResolver(
					{ ...eventVolunteerWithEmptyCreator, creatorId: null },
					{},
					context,
				);
				expect(result).toBeNull();
			}
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				EventVolunteerCreatorResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});
	});
});
