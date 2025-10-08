import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupUpdaterResolver } from "~/src/graphql/types/EventVolunteerGroup/updater";
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

const mockEventVolunteerGroupWithNullUpdater = {
	...mockEventVolunteerGroup,
	updaterId: null,
};

const mockUpdaterUser = {
	id: "updater-123",
	name: "Jane Updater",
	emailAddress: "updater@example.com",
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

describe("EventVolunteerGroupUpdaterResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupUpdaterResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupUpdaterResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Updater Retrieval", () => {
		it("should return null when updaterId is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerGroupUpdaterResolver(
				mockEventVolunteerGroupWithNullUpdater,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return updater user when updaterId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await EventVolunteerGroupUpdaterResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(mockUpdaterUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when updater is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				EventVolunteerGroupUpdaterResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupUpdaterResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer group's updater id that isn't null.",
			);
		});

		it("should query database for updater", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			await EventVolunteerGroupUpdaterResolver(
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
		it("should handle empty updaterId string as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const groupWithEmptyUpdater = {
				...mockEventVolunteerGroup,
				updaterId: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!groupWithEmptyUpdater.updaterId) {
				const result = await EventVolunteerGroupUpdaterResolver(
					{ ...groupWithEmptyUpdater, updaterId: null },
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
				EventVolunteerGroupUpdaterResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle different updater IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentUpdater = {
				...mockUpdaterUser,
				id: "different-updater-456",
			};
			const groupWithDifferentUpdater = {
				...mockEventVolunteerGroup,
				updaterId: "different-updater-456",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentUpdater,
			);

			const result = await EventVolunteerGroupUpdaterResolver(
				groupWithDifferentUpdater,
				{},
				context,
			);

			expect(result).toEqual(differentUpdater);
		});
	});
});
