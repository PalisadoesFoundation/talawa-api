import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { volunteerGroupAssignmentInviteStatusEnum } from "~/src/drizzle/enums/volunteerGroupAssignmentInviteStatus";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveGroup } from "~/src/graphql/types/VolunteerGroupAssignment/group";

const mockVolunteerGroupAssignment = {
	createdAt: new Date("2025-05-05T20:26:44.107Z"),
	creatorId: "creator123",
	groupId: "event123",
	assigneeId: "leader123",
	inviteStatus: volunteerGroupAssignmentInviteStatusEnum.Values.no_response,
	updatedAt: new Date("2025-05-05T20:26:44.107Z"),
	updaterId: "creator123",
};

const mockUser = {
	eventId: "event123",
	id: "group123",
};

describe("VolunteerGroupAssignment.group resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user456",
		);
		ctx = context;
		mocks = newMocks;
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);

		await expect(
			resolveGroup(mockVolunteerGroupAssignment, {}, unauthenticatedCtx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	test("throws an error if volunteer group does not exist", async () => {
		mocks.drizzleClient.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								execute: vi.fn().mockResolvedValue([]),
							}),
						}),
					}),
				}),
			}),
		});

		await expect(
			resolveGroup(mockVolunteerGroupAssignment, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["input", "groupId"] }],
				}),
			}),
		);
	});

	test("throws an unauthenticated error if user does not exist", async () => {
		const mockResult = {
			volunteerGroup: {
				id: "group123",
				eventId: "event123",
			},
			event: {
				organizationId: "org123",
			},
			user: null,
			orgMembership: null,
		};

		mocks.drizzleClient.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								execute: vi.fn().mockResolvedValue([mockResult]),
							}),
						}),
					}),
				}),
			}),
		});

		await expect(
			resolveGroup(mockVolunteerGroupAssignment, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	test("throws an unauthorized error if user is not administrator and not organization member", async () => {
		const mockResult = {
			volunteerGroup: {
				id: "group123",
				eventId: "event123",
			},
			event: {
				organizationId: "org123",
			},
			user: {
				id: "user456",
				role: "user",
			},
			orgMembership: null,
		};

		mocks.drizzleClient.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								execute: vi.fn().mockResolvedValue([mockResult]),
							}),
						}),
					}),
				}),
			}),
		});

		await expect(
			resolveGroup(mockVolunteerGroupAssignment, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("handles database query chain correctly", async () => {
		const mockResult = {
			volunteerGroup: {
				id: "group123",
				eventId: "event123",
			},
			event: {
				organizationId: "org123",
			},
			user: {
				id: "user456",
				role: "administrator",
			},
			orgMembership: null,
		};

		const mockExecute = vi.fn().mockResolvedValue([mockResult]);
		const mockWhere = vi.fn().mockReturnValue({ execute: mockExecute });
		const mockLeftJoin3 = vi.fn().mockReturnValue({ where: mockWhere });
		const mockLeftJoin2 = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin3 });
		const mockLeftJoin1 = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin2 });
		const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin1 });

		mocks.drizzleClient.select.mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);

		await resolveGroup(mockVolunteerGroupAssignment, {}, ctx);

		expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
		expect(mockFrom).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin1).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin2).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin3).toHaveBeenCalledTimes(1);
		expect(mockWhere).toHaveBeenCalledTimes(1);
		expect(mockExecute).toHaveBeenCalledTimes(1);
	});
});
