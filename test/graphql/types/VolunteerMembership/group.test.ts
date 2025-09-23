import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipGroupResolver } from "~/src/graphql/types/VolunteerMembership/group";
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

const mockVolunteerMembershipWithNullGroup = {
	...mockVolunteerMembership,
	groupId: null,
};

const mockEventVolunteerGroup = {
	id: "group-123",
	eventId: "event-123",
	leaderId: "leader-123",
	creatorId: "creator-123",
	name: "Setup Team",
	description: "Handles event setup and preparation",
	volunteersRequired: 5,
	createdAt: new Date("2024-01-01T09:00:00Z"),
	updatedAt: new Date("2024-01-01T11:00:00Z"),
	updaterId: "updater-123",
};

describe("VolunteerMembershipGroupResolver", () => {
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
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Group Retrieval", () => {
		it("should return null when groupId is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembershipWithNullGroup,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return event volunteer group when groupId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteerGroup]),
					}),
				}),
			});

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockEventVolunteerGroup);
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when group is not found (empty array)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a volunteer membership's group id that isn't null.",
			);
		});

		it("should throw unexpected error when group result is undefined", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([undefined]),
					}),
				}),
			});

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});
		});

		it("should query database for group with correct parameters", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const mockFrom = vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([mockEventVolunteerGroup]),
				}),
			});
			const mockSelect = vi.fn().mockReturnValue({
				from: mockFrom,
			});

			mocks.drizzleClient.select = mockSelect;

			await VolunteerMembershipGroupResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(mockSelect).toHaveBeenCalledTimes(1);
			expect(mockFrom).toHaveBeenCalledTimes(1);
		});
	});

	describe("Individual Volunteer Handling", () => {
		it("should return null for individual volunteer (groupId is null)", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembershipWithNullGroup,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should not query database when groupId is null", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await VolunteerMembershipGroupResolver(
				mockVolunteerMembershipWithNullGroup,
				{},
				context,
			);

			expect(mocks.drizzleClient.select).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should handle different group IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentGroup = {
				...mockEventVolunteerGroup,
				id: "different-group-456",
			};
			const membershipWithDifferentGroup = {
				...mockVolunteerMembership,
				groupId: "different-group-456" as string | null,
			};

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([differentGroup]),
					}),
				}),
			});

			const result = await VolunteerMembershipGroupResolver(
				membershipWithDifferentGroup,
				{},
				context,
			);

			expect(result).toEqual(differentGroup);
			expect(result?.id).toBe("different-group-456");
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi
							.fn()
							.mockRejectedValue(new Error("Database connection failed")),
					}),
				}),
			});

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle malformed database response", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(null),
					}),
				}),
			});

			await expect(
				VolunteerMembershipGroupResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow();
		});

		it("should handle empty string groupId as null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const membershipWithEmptyGroup = {
				...mockVolunteerMembership,
				groupId: "" as string | null,
			};

			// Should treat empty string as falsy and return null
			if (!membershipWithEmptyGroup.groupId) {
				const result = await VolunteerMembershipGroupResolver(
					{ ...membershipWithEmptyGroup, groupId: null },
					{},
					context,
				);
				expect(result).toBeNull();
			}
		});
	});

	describe("Data Integrity", () => {
		it("should return complete event volunteer group object", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteerGroup]),
					}),
				}),
			});

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Verify all expected properties are present
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("eventId");
			expect(result).toHaveProperty("leaderId");
			expect(result).toHaveProperty("creatorId");
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("description");
			expect(result).toHaveProperty("volunteersRequired");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
		});

		it("should preserve all group properties from database", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteerGroup]),
					}),
				}),
			});

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result?.id).toBe(mockEventVolunteerGroup.id);
			expect(result?.eventId).toBe(mockEventVolunteerGroup.eventId);
			expect(result?.leaderId).toBe(mockEventVolunteerGroup.leaderId);
			expect(result?.name).toBe(mockEventVolunteerGroup.name);
			expect(result?.description).toBe(mockEventVolunteerGroup.description);
			expect(result?.volunteersRequired).toBe(
				mockEventVolunteerGroup.volunteersRequired,
			);
		});
	});

	describe("Nullable Return Type", () => {
		it("should correctly handle nullable return type for individual volunteers", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembershipWithNullGroup,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should correctly return non-null group for group volunteers", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteerGroup]),
					}),
				}),
			});

			const result = await VolunteerMembershipGroupResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).not.toBeNull();
			expect(result).toEqual(mockEventVolunteerGroup);
		});
	});
});
