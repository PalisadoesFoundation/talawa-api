import type { SQL } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { usersTable } from "../../../../src/drizzle/tables/users";

const organizationMembershipsTable = pgTable("organization_memberships", {
	userId: uuid("user_id").references(() => usersTable.id),
	organizationId: uuid("organization_id").notNull(),
	role: text("role").notNull(),
});

interface DrizzleOperators {
	eq: <T>(field: SQL<T>, value: T) => SQL<boolean>;
	and: (...conditions: SQL<boolean>[]) => SQL<boolean>;
}

interface UserRow {
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
}

interface TestContext {
	currentClient: {
		isAuthenticated: boolean;
		user: {
			id: string;
			role: string;
		};
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	};
}
interface OrganizationMembership {
	role: string;
	organizationId: string;
}

async function resolveUpdatedAt(
	parent: Advertisement,
	_args: unknown,
	ctx: TestContext,
): Promise<Date | null> {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	if (!parent.organizationId) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["organizationId"],
						message: "Organization ID cannot be null",
					},
				],
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	try {
		const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			columns: { role: true },
			with: {
				organizationMembershipsWhereMember: {
					columns: { role: true },
					where: () =>
						eq(
							organizationMembershipsTable.organizationId,
							parent.organizationId,
						),
				},
			},
			where: () => eq(usersTable.id, currentUserId),
		});

		if (!currentUser) {
			throw new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			});
		}
		if (currentUser.role === "administrator") {
			return parent.updatedAt;
		}

		// Check if user has admin rights in any of their organization memberships
		const hasOrgAdminRights =
			currentUser.organizationMembershipsWhereMember.some(
				(membership: OrganizationMembership) =>
					membership.role === "administrator" &&
					membership.organizationId === parent.organizationId,
			);

		if (!hasOrgAdminRights) {
			throw new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			});
		}

		return parent.updatedAt;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		throw new Error("Database connection error");
	}
}

type WhereClause = (
	fields: typeof usersTable | typeof organizationMembershipsTable,
	operators: DrizzleOperators,
) => SQL<boolean>;

describe("Advertisement Resolver - UpdatedAt Field", () => {
	let ctx: TestContext;
	let mockAdvertisement: Advertisement;

	beforeEach(() => {
		mockAdvertisement = {
			id: "advert-123",
			name: "Test Advertisement",
			description: "Test Description",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: "user-123",
			organizationId: "org-123",
			type: "banner",
			startAt: new Date(),
			endAt: new Date(),
			attachments: [],
		};

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "user-123",
					role: "member",
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn(),
					},
				},
			},
		};
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should allow access if user is system administrator", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		expect(result).toBe(mockAdvertisement.updatedAt);
	});

	it("should allow access if user is organization administrator", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockAdvertisement.organizationId,
				},
			],
		});

		const result = await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		expect(result).toBe(mockAdvertisement.updatedAt);
	});

	it("should deny access if user is not an administrator", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
					organizationId: mockAdvertisement.organizationId,
				},
			],
		});

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should deny access if user has no organization membership", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [],
		});

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should make correct database query for user role check", async () => {
		const mockUser: UserRow = {
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);

		await resolveUpdatedAt(mockAdvertisement, {}, ctx);

		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith({
			columns: { role: true },
			with: {
				organizationMembershipsWhereMember: {
					columns: { role: true },
					where: expect.any(Function) as WhereClause,
				},
			},
			where: expect.any(Function) as WhereClause,
		});
	});

	it("should handle user with multiple organization memberships", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
					organizationId: "other-org-123",
				},
				{
					role: "administrator",
					organizationId: mockAdvertisement.organizationId,
				},
			],
		});

		const result = await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		expect(result).toBe(mockAdvertisement.updatedAt);
	});

	it("should handle user with administrator role in wrong organization", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: "different-org-id",
				},
			],
		});

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should handle case-sensitive role checks", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "Administrator",
			organizationMembershipsWhereMember: [],
		});

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should handle missing user data from database", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(null);

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});
	it("should handle database query errors", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Database connection error"),
		);

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(/Database connection error|Something went wrong/);
	});

	it("should handle empty role string: ", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "",
			organizationMembershipsWhereMember: [],
		});

		await expect(async () => {
			await resolveUpdatedAt(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});
