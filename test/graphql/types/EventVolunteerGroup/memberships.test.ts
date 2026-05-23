import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupMembershipsResolver } from "~/src/graphql/types/EventVolunteerGroup/memberships";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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

const mockMembershipBase = {
	volunteerId: "volunteer-1",
	groupId: "group-123" as string | null,
	eventId: "event-123",
	createdBy: "creator-123" as string | null,
	updatedBy: null as string | null,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: null as Date | null,
};

const mockInvitedMembership = {
	...mockMembershipBase,
	id: "membership-invited",
	status: "invited" as const,
};

const mockAcceptedMembership = {
	...mockMembershipBase,
	id: "membership-accepted",
	volunteerId: "volunteer-2",
	status: "accepted" as const,
};

const mockRejectedMembership = {
	...mockMembershipBase,
	id: "membership-rejected",
	volunteerId: "volunteer-3",
	status: "rejected" as const,
};

const mockRequestedMembership = {
	...mockMembershipBase,
	id: "membership-requested",
	volunteerId: "volunteer-4",
	status: "requested" as const,
};

const allMemberships = [
	mockInvitedMembership,
	mockAcceptedMembership,
	mockRejectedMembership,
	mockRequestedMembership,
];

const buildSelectChain = (
	mocks: ReturnType<typeof createMockGraphQLContext>["mocks"],
	resolvedValue: unknown,
) => {
	const executeMock = vi.fn().mockResolvedValue(resolvedValue);
	const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
	const fromMock = vi.fn().mockReturnValue({ where: whereMock });

	mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

	return { executeMock, whereMock, fromMock };
};

describe("EventVolunteerGroupMembershipsResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupMembershipsResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupMembershipsResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Default behavior (status omitted)", () => {
		it("should return memberships of every status when status is omitted", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, allMemberships);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(allMemberships);
			expect(result).toHaveLength(4);
			const statuses = result.map((m) => m.status).sort();
			expect(statuses).toEqual([
				"accepted",
				"invited",
				"rejected",
				"requested",
			]);
		});

		it("should return memberships of every status when status is null", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, allMemberships);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{ status: null },
				context,
			);

			expect(result).toEqual(allMemberships);
		});

		it("should return empty array when no memberships exist", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, []);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual([]);
		});
	});

	describe("Status filter", () => {
		it("should return only invited memberships when status='invited'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, [mockInvitedMembership]);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{ status: "invited" },
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.status).toBe("invited");
		});

		it("should return only accepted memberships when status='accepted'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, [mockAcceptedMembership]);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{ status: "accepted" },
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.status).toBe("accepted");
		});

		it("should return only rejected memberships when status='rejected'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, [mockRejectedMembership]);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{ status: "rejected" },
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.status).toBe("rejected");
		});

		it("should return only requested memberships when status='requested'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, [mockRequestedMembership]);

			const result = await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{ status: "requested" },
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.status).toBe("requested");
		});
	});

	describe("Query Performance", () => {
		it("should run exactly one query (no N+1)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			const { executeMock, whereMock, fromMock } = buildSelectChain(
				mocks,
				allMemberships,
			);

			await EventVolunteerGroupMembershipsResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(fromMock).toHaveBeenCalledTimes(1);
			expect(whereMock).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should propagate database errors", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await expect(
				EventVolunteerGroupMembershipsResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle different group IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentGroup = {
				...mockEventVolunteerGroup,
				id: "different-group-456",
			};
			buildSelectChain(mocks, []);

			const result = await EventVolunteerGroupMembershipsResolver(
				differentGroup,
				{},
				context,
			);

			expect(result).toEqual([]);
		});
	});
});
