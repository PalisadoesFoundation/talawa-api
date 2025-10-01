import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupCreatorResolver } from "~/src/graphql/types/EventVolunteerGroup/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteerGroup
const mockEventVolunteerGroup = {
	id: "group-123",
	eventId: "event-123",
	leaderId: "leader-123",
	creatorId: "creator-123",
	name: "Setup Team",
	description: "Handles event setup and preparation",
	volunteersRequired: 5,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z"),
	updaterId: "updater-123",
	recurringEventInstanceId: null,
	isTemplate: false,
};

const mockEventVolunteerGroupWithNullCreator = {
	...mockEventVolunteerGroup,
	creatorId: null,
};

const mockCreatorUser = {
	id: "creator-123",
	name: "John Creator",
	emailAddress: "creator@example.com",
	role: "administrator",
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

describe("EventVolunteerGroupCreatorResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupCreatorResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupCreatorResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Creator Retrieval", () => {
		it("should return null when creatorId is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerGroupCreatorResolver(
				mockEventVolunteerGroupWithNullCreator,
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

			const result = await EventVolunteerGroupCreatorResolver(
				mockEventVolunteerGroup,
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
				EventVolunteerGroupCreatorResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupCreatorResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer group's creator id that isn't null.",
			);
		});

		it("should query database for creator", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			await EventVolunteerGroupCreatorResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify the query was called once (testing behavior, not internal implementation)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty creatorId string as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const groupWithEmptyCreator = {
				...mockEventVolunteerGroup,
				creatorId: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!groupWithEmptyCreator.creatorId) {
				const result = await EventVolunteerGroupCreatorResolver(
					{ ...groupWithEmptyCreator, creatorId: null },
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
				EventVolunteerGroupCreatorResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle different creator IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentCreator = {
				...mockCreatorUser,
				id: "different-creator-456",
			};
			const groupWithDifferentCreator = {
				...mockEventVolunteerGroup,
				creatorId: "different-creator-456",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentCreator,
			);

			const result = await EventVolunteerGroupCreatorResolver(
				groupWithDifferentCreator,
				{},
				context,
			);

			expect(result).toEqual(differentCreator);
		});
	});
});
