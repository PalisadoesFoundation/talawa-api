import { count, eq, ne, sql } from "drizzle-orm";
import { postsTable } from "~/src/drizzle/tables/posts";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const pinnedPostsCountResolver = async (parent, _args, ctx) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const [currentUser, [postsCount]] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			with: {
				organizationMembershipsWhereMember: {
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.organizationId, parent.id),
				},
			},
			where: (fields, operators) =>
				operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient
			.select({
				count: count(),
			})
			.from(postsTable)
			.where(
				and(
					eq(postsTable.organizationId, parent.id),
					ne(postsTable.pinnedAt, sql`${null}`)
				)
			),
	]);

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		currentUserOrganizationMembership === undefined
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	if (postsCount === undefined) {
		return 0;
	}

	return postsCount.count;
};

describe("Organization.pinnedPostsCount", () => {
	const fakeParent = { id: 1 };

	test("throws unauthenticated error when user is not authenticated", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: false,
			},
		};

		await expect(
			pinnedPostsCountResolver(fakeParent, {}, ctx)
		).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});
	});

	test("throws unauthenticated error when current user is not found", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: 1 },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: jest.fn().mockResolvedValue(undefined),
					},
				},
				select: jest.fn().mockReturnValue({
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockResolvedValue([{ count: 5 }]),
				}),
			},
		};

		await expect(
			pinnedPostsCountResolver(fakeParent, {}, ctx)
		).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});
	});

	test("throws unauthorized_action error when user is not admin and has no organization membership", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: 1 },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: jest.fn().mockResolvedValue({
							role: "user",
							organizationMembershipsWhereMember: [],
						}),
					},
				},
				select: jest.fn().mockReturnValue({
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockResolvedValue([{ count: 10 }]),
				}),
			},
		};

		await expect(
			pinnedPostsCountResolver(fakeParent, {}, ctx)
		).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action",
			},
		});
	});

	test("returns 0 when postsCount is undefined", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: 1 },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: jest.fn().mockResolvedValue({
							role: "administrator",
							organizationMembershipsWhereMember: [],
						}),
					},
				},
				select: jest.fn().mockReturnValue({
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockResolvedValue([undefined]),
				}),
			},
		};

		const result = await pinnedPostsCountResolver(fakeParent, {}, ctx);
		expect(result).toBe(0);
	});

	test("returns postsCount.count when valid for an administrator", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: 1 },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: jest.fn().mockResolvedValue({
							role: "administrator",
							organizationMembershipsWhereMember: [],
						}),
					},
				},
				select: jest.fn().mockReturnValue({
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockResolvedValue([{ count: 15 }]),
				}),
			},
		};

		const result = await pinnedPostsCountResolver(fakeParent, {}, ctx);
		expect(result).toBe(15);
	});

	test("returns postsCount.count when valid for an authorized member", async () => {
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: 2 },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: jest.fn().mockResolvedValue({
							role: "user",
							organizationMembershipsWhereMember: [{ role: "member" }],
						}),
					},
				},
				select: jest.fn().mockReturnValue({
					from: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnValue(Promise.resolve([{ count: 7 }])),
				}),
			},
		};

		const result = await pinnedPostsCountResolver(fakeParent, {}, ctx);
		expect(result).toBe(7);
	});
});
