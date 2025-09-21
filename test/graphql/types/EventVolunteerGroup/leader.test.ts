import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupLeaderResolver } from "~/src/graphql/types/EventVolunteerGroup/leader";
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
};

const mockLeaderUser = {
	id: "leader-123",
	name: "Bob Leader",
	emailAddress: "leader@example.com",
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

describe("EventVolunteerGroupLeaderResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupLeaderResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupLeaderResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Leader Retrieval", () => {
		it("should return leader user when leaderId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockLeaderUser,
			);

			const result = await EventVolunteerGroupLeaderResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(mockLeaderUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when leader is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				EventVolunteerGroupLeaderResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupLeaderResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer group's leader id that isn't null.",
			);
		});

		it("should query database for leader", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockLeaderUser,
			);

			await EventVolunteerGroupLeaderResolver(
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

	describe("Leader Field Requirements", () => {
		it("should handle different leader IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentLeader = { ...mockLeaderUser, id: "different-leader-456" };
			const groupWithDifferentLeader = {
				...mockEventVolunteerGroup,
				leaderId: "different-leader-456",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentLeader,
			);

			const result = await EventVolunteerGroupLeaderResolver(
				groupWithDifferentLeader,
				{},
				context,
			);

			expect(result).toEqual(differentLeader);
		});
	});

	describe("Edge Cases", () => {
		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				EventVolunteerGroupLeaderResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toThrow("Database connection failed");
		});

		it("should validate leader is found for non-null leaderId", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock leader found scenario
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockLeaderUser,
			);

			const result = await EventVolunteerGroupLeaderResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).not.toBeNull();
			expect(result).not.toBeUndefined();
			expect(result?.id).toBe(mockLeaderUser.id);
		});
	});
});
