import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { volunteerGroupAssignmentInviteStatusEnum } from "~/src/drizzle/enums/volunteerGroupAssignmentInviteStatus";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreator } from "~/src/graphql/types/VolunteerGroupAssignment/creator";

const mockVolunteerGroupAssignment = {
	createdAt: new Date("2025-05-05T20:26:44.107Z"),
	creatorId: "creator123",
	groupId: "event123",
	assigneeId: "leader123",
	inviteStatus: volunteerGroupAssignmentInviteStatusEnum.Values.no_response,
	updatedAt: new Date("2025-05-05T20:26:44.107Z"),
	updaterId: "user123",
};

const mockVolunteerGroupAssignmentNullCreator = {
	...mockVolunteerGroupAssignment,
	creatorId: null,
};

const mockCreatorUser = {
	id: "creator123",
	name: "John Creator",
	email: "creator@example.com",
	role: "user",
};

describe("VolunteerGroupAssignment.creator resolver", () => {
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
			resolveCreator(mockVolunteerGroupAssignment, {}, unauthenticatedCtx),
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
			resolveCreator(mockVolunteerGroupAssignment, {}, ctx),
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
			resolveCreator(mockVolunteerGroupAssignment, {}, ctx),
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
			resolveCreator(mockVolunteerGroupAssignment, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns null when creatorId is null", async () => {
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

		const result = await resolveCreator(
			mockVolunteerGroupAssignmentNullCreator,
			{},
			ctx,
		);
		expect(result).toBeNull();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	test("throws an unexpected error when creator user does not exist but creatorId is not null", async () => {
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

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveCreator(mockVolunteerGroupAssignment, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a group's creator id that isn't null.",
		);
	});

	test("returns creator user when user is administrator", async () => {
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

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreatorUser,
		);

		const result = await resolveCreator(mockVolunteerGroupAssignment, {}, ctx);

		expect(result).toEqual(mockCreatorUser);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				where: expect.any(Function),
			},
		);
	});

	test("returns creator user when user is organization member", async () => {
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
			orgMembership: {
				role: "regular",
			},
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

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreatorUser,
		);

		const result = await resolveCreator(mockVolunteerGroupAssignment, {}, ctx);

		expect(result).toEqual(mockCreatorUser);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				where: expect.any(Function),
			},
		);
	});

	test("returns creator user when user is organization admin member", async () => {
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
			orgMembership: {
				role: "admin",
			},
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

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreatorUser,
		);

		const result = await resolveCreator(mockVolunteerGroupAssignment, {}, ctx);

		expect(result).toEqual(mockCreatorUser);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				where: expect.any(Function),
			},
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
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCreatorUser,
		);

		await resolveCreator(mockVolunteerGroupAssignment, {}, ctx);

		expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
		expect(mockFrom).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin1).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin2).toHaveBeenCalledTimes(1);
		expect(mockLeftJoin3).toHaveBeenCalledTimes(1);
		expect(mockWhere).toHaveBeenCalledTimes(1);
		expect(mockExecute).toHaveBeenCalledTimes(1);
	});
});
