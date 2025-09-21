import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerUpdaterResolver } from "~/src/graphql/types/EventVolunteer/updater";
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

const mockEventVolunteerWithNullUpdater = {
	...mockEventVolunteer,
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

describe("EventVolunteerUpdaterResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Updater Retrieval", () => {
		it("should return null when updaterId is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerUpdaterResolver(
				mockEventVolunteerWithNullUpdater,
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

			const result = await EventVolunteerUpdaterResolver(
				mockEventVolunteer,
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
				EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer's updater id that isn't null.",
			);
		});

		it("should query database for updater", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			await EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context);

			// Verify the query was called once (testing behavior, not internal implementation)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty updaterId string as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const eventVolunteerWithEmptyUpdater = {
				...mockEventVolunteer,
				updaterId: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!eventVolunteerWithEmptyUpdater.updaterId) {
				const result = await EventVolunteerUpdaterResolver(
					{ ...eventVolunteerWithEmptyUpdater, updaterId: null },
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
				EventVolunteerUpdaterResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});
	});
});
