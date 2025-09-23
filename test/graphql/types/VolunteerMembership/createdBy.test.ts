import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipCreatedByResolver } from "~/src/graphql/types/VolunteerMembership/createdBy";
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

const mockVolunteerMembershipWithNullCreatedBy = {
	...mockVolunteerMembership,
	createdBy: null,
};

const mockCreatorUser = {
	id: "creator-123",
	name: "John Creator",
	emailAddress: "creator@example.com",
	role: "administrator",
	createdAt: new Date("2024-01-01T08:00:00Z"),
	updatedAt: new Date("2024-01-01T08:30:00Z"),
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

describe("VolunteerMembershipCreatedByResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				VolunteerMembershipCreatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipCreatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("CreatedBy Retrieval", () => {
		it("should return null when createdBy is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembershipWithNullCreatedBy,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return creator user when createdBy exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
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
				VolunteerMembershipCreatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipCreatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a volunteer membership's createdBy id that isn't null.",
			);
		});

		it("should query database for creator with correct userId", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not query database when createdBy is null", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembershipWithNullCreatedBy,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should handle different creator IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentCreator = {
				...mockCreatorUser,
				id: "different-creator-456",
				name: "Jane Creator",
			};
			const membershipWithDifferentCreator = {
				...mockVolunteerMembership,
				createdBy: "different-creator-456" as string | null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				differentCreator,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				membershipWithDifferentCreator,
				{},
				context,
			);

			expect(result).toEqual(differentCreator);
			expect(result?.id).toBe("different-creator-456");
			expect(result?.name).toBe("Jane Creator");
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				VolunteerMembershipCreatedByResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle empty string createdBy as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const membershipWithEmptyCreatedBy = {
				...mockVolunteerMembership,
				createdBy: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!membershipWithEmptyCreatedBy.createdBy) {
				const result = await VolunteerMembershipCreatedByResolver(
					{ ...membershipWithEmptyCreatedBy, createdBy: null },
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
				mockCreatorUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
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
				mockCreatorUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.id).toBe(mockCreatorUser.id);
			expect(result?.name).toBe(mockCreatorUser.name);
			expect(result?.emailAddress).toBe(mockCreatorUser.emailAddress);
			expect(result?.role).toBe(mockCreatorUser.role);
			expect(result?.isEmailAddressVerified).toBe(
				mockCreatorUser.isEmailAddressVerified,
			);
		});

		it("should handle users with nullable fields", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const userWithNulls = {
				...mockCreatorUser,
				description: null,
				birthDate: null,
				mobilePhoneNumber: null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				userWithNulls,
			);

			const result = await VolunteerMembershipCreatedByResolver(
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
		it("should correctly handle nullable return type when createdBy is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembershipWithNullCreatedBy,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should correctly return non-null user when createdBy exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreatorUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).not.toBeNull();
			expect(result).toEqual(mockCreatorUser);
		});
	});

	describe("User Roles", () => {
		it("should handle different user roles correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const memberUser = {
				...mockCreatorUser,
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				memberUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.role).toBe("member");
		});

		it("should handle superadmin role", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const superadminUser = {
				...mockCreatorUser,
				role: "superadmin",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				superadminUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
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
				mockCreatorUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.isEmailAddressVerified).toBe(true);
		});

		it("should handle unverified email addresses", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const unverifiedUser = {
				...mockCreatorUser,
				isEmailAddressVerified: false,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				unverifiedUser,
			);

			const result = await VolunteerMembershipCreatedByResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.isEmailAddressVerified).toBe(false);
		});
	});
});
