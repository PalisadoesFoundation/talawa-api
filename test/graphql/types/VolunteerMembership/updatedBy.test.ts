import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipUpdatedByResolver } from "~/src/graphql/types/VolunteerMembership/updatedBy";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent VolunteerMembership
const mockVolunteerMembership = {
	id: "membership-123",
	volunteerId: "volunteer-123",
	groupId: "group-123" as string | null,
	eventId: "event-123",
	status: "accepted" as "accepted" | "invited" | "requested" | "rejected",
	createdBy: "creator-123" as string | null,
	updatedBy: "updater-123" as string | null,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z") as Date | null,
};

const mockVolunteerMembershipWithNullUpdatedBy = {
	...mockVolunteerMembership,
	updatedBy: null,
};

const mockUpdaterUser = {
	id: "updater-123",
	name: "Jane Updater",
	emailAddress: "updater@example.com",
	role: "member",
	createdAt: new Date("2024-01-01T07:00:00Z"),
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

describe("VolunteerMembershipUpdatedByResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				VolunteerMembershipUpdatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipUpdatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("UpdatedBy Retrieval", () => {
		it("should return null when updatedBy is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembershipWithNullUpdatedBy,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return updater user when updatedBy exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
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
				VolunteerMembershipUpdatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipUpdatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a volunteer membership's updatedBy id that isn't null.",
			);
		});

		it("should query database for updater with correct userId", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not query database when updatedBy is null", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembershipWithNullUpdatedBy,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should handle different updater IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentUpdater = {
				...mockUpdaterUser,
				id: "different-updater-456",
				name: "John Updater",
			};
			const membershipWithDifferentUpdater = {
				...mockVolunteerMembership,
				updatedBy: "different-updater-456" as string | null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentUpdater,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				membershipWithDifferentUpdater,
				{},
				context,
			);

			expect(result).toEqual(differentUpdater);
			expect(result?.id).toBe("different-updater-456");
			expect(result?.name).toBe("John Updater");
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				VolunteerMembershipUpdatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle empty string updatedBy as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const membershipWithEmptyUpdatedBy = {
				...mockVolunteerMembership,
				updatedBy: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!membershipWithEmptyUpdatedBy.updatedBy) {
				const result = await VolunteerMembershipUpdatedByResolver(
					{ ...membershipWithEmptyUpdatedBy, updatedBy: null },
					{},
					context,
				);
				expect(result).toBeNull();
			}
		});
	});

	describe("Data Integrity", () => {
		it("should return complete user object", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Verify all expected properties are present
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("emailAddress");
			expect(result).toHaveProperty("role");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
			expect(result).toHaveProperty("isEmailAddressVerified");
		});

		it("should preserve all user properties from database", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.id).toBe(mockUpdaterUser.id);
			expect(result?.name).toBe(mockUpdaterUser.name);
			expect(result?.emailAddress).toBe(mockUpdaterUser.emailAddress);
			expect(result?.role).toBe(mockUpdaterUser.role);
			expect(result?.isEmailAddressVerified).toBe(
				mockUpdaterUser.isEmailAddressVerified,
			);
		});

		it("should handle users with nullable fields", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const userWithNulls = {
				...mockUpdaterUser,
				description: null,
				birthDate: null,
				mobilePhoneNumber: null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				userWithNulls,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.description).toBeNull();
			expect(result?.birthDate).toBeNull();
			expect(result?.mobilePhoneNumber).toBeNull();
		});
	});

	describe("Nullable Return Type", () => {
		it("should correctly handle nullable return type when updatedBy is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembershipWithNullUpdatedBy,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should correctly return non-null user when updatedBy exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).not.toBeNull();
			expect(result).toEqual(mockUpdaterUser);
		});
	});

	describe("User Roles", () => {
		it("should handle different user roles correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const adminUser = {
				...mockUpdaterUser,
				role: "administrator",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				adminUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.role).toBe("administrator");
		});

		it("should handle superadmin role", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const superadminUser = {
				...mockUpdaterUser,
				role: "superadmin",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				superadminUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.role).toBe("superadmin");
		});
	});

	describe("Email Verification", () => {
		it("should handle verified email addresses", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUpdaterUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.isEmailAddressVerified).toBe(true);
		});

		it("should handle unverified email addresses", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const unverifiedUser = {
				...mockUpdaterUser,
				isEmailAddressVerified: false,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				unverifiedUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.isEmailAddressVerified).toBe(false);
		});
	});

	describe("Same User as Creator and Updater", () => {
		it("should handle when creator and updater are the same user", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const sameUser = {
				...mockUpdaterUser,
				id: "creator-123",
			};

			const membershipWithSameCreatorUpdater = {
				...mockVolunteerMembership,
				createdBy: "creator-123" as string | null,
				updatedBy: "creator-123" as string | null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				sameUser,
			);

			const result = await VolunteerMembershipUpdatedByResolver(
				membershipWithSameCreatorUpdater,
				{},
				context,
			);

			expect(result?.id).toBe("creator-123");
			expect(result).toEqual(sameUser);
		});
	});
});
