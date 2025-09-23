import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipVolunteerResolver } from "~/src/graphql/types/VolunteerMembership/volunteer";
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

const mockEventVolunteer = {
	id: "volunteer-123",
	userId: "user-123",
	eventId: "event-123",
	creatorId: "creator-123",
	hasAccepted: true,
	isPublic: true,
	hoursVolunteered: "8.00",
	createdAt: new Date("2024-01-01T09:00:00Z"),
	updatedAt: new Date("2024-01-01T11:00:00Z"),
	updaterId: "updater-123",
};

describe("VolunteerMembershipVolunteerResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Volunteer Retrieval", () => {
		it("should return event volunteer when volunteerId exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteer]),
					}),
				}),
			});

			const result = await VolunteerMembershipVolunteerResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockEventVolunteer);
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when volunteer is not found (empty array)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a volunteer membership's volunteer id that isn't null.",
			);
		});

		it("should throw unexpected error when volunteer result is undefined", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([undefined]),
					}),
				}),
			});

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});
		});

		it("should query database for volunteer with correct parameters", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const mockFrom = vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([mockEventVolunteer]),
				}),
			});
			const mockSelect = vi.fn().mockReturnValue({
				from: mockFrom,
			});

			mocks.drizzleClient.select = mockSelect;

			await VolunteerMembershipVolunteerResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(mockSelect).toHaveBeenCalledTimes(1);
			expect(mockFrom).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different volunteer IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentVolunteer = {
				...mockEventVolunteer,
				id: "different-volunteer-456",
			};
			const membershipWithDifferentVolunteer = {
				...mockVolunteerMembership,
				volunteerId: "different-volunteer-456",
			};

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([differentVolunteer]),
					}),
				}),
			});

			const result = await VolunteerMembershipVolunteerResolver(
				membershipWithDifferentVolunteer,
				{},
				context,
			);

			expect(result).toEqual(differentVolunteer);
			expect(result.id).toBe("different-volunteer-456");
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
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
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
				VolunteerMembershipVolunteerResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow();
		});
	});

	describe("Data Integrity", () => {
		it("should return complete event volunteer object", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteer]),
					}),
				}),
			});

			const result = await VolunteerMembershipVolunteerResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Verify all expected properties are present
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("userId");
			expect(result).toHaveProperty("eventId");
			expect(result).toHaveProperty("creatorId");
			expect(result).toHaveProperty("hasAccepted");
			expect(result).toHaveProperty("isPublic");
			expect(result).toHaveProperty("hoursVolunteered");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
		});

		it("should preserve all volunteer properties from database", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockEventVolunteer]),
					}),
				}),
			});

			const result = await VolunteerMembershipVolunteerResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.id).toBe(mockEventVolunteer.id);
			expect(result.userId).toBe(mockEventVolunteer.userId);
			expect(result.eventId).toBe(mockEventVolunteer.eventId);
			expect(result.hasAccepted).toBe(mockEventVolunteer.hasAccepted);
			expect(result.hoursVolunteered).toBe(mockEventVolunteer.hoursVolunteered);
		});
	});
});
