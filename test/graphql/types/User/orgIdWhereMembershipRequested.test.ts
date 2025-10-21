import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the resolver function by creating a test version
const resolveOrgIdWhereMembershipRequested = async (
	parent: User,
	_args: Record<string, unknown>,
	ctx: ExplicitGraphQLContext & ImplicitMercuriusContext,
): Promise<string[]> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	if (currentUser.role !== "administrator" && currentUserId !== parent.id) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	const membershipRequests =
		await ctx.drizzleClient.query.membershipRequestsTable.findMany({
			columns: { organizationId: true },
			where: (fields, operators) =>
				operators.and(
					operators.eq(fields.userId, parent.id),
					operators.eq(fields.status, "pending"),
				),
		});
	const ids = Array.from(
		new Set(
			membershipRequests.map(
				(r: { organizationId: string }) => r.organizationId,
			),
		),
	);
	return ids;
};

const mockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: vi.fn().mockResolvedValue({
				id: "user123",
				role: "regular",
			}),
		},
		membershipRequestsTable: {
			findMany: vi.fn().mockResolvedValue([
				{ organizationId: "org1" },
				{ organizationId: "org2" },
				{ organizationId: "org1" }, // Duplicate to test deduplication
			]),
		},
	},
};

const baseMockCtx = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "user123", role: "regular" },
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
} as unknown as ExplicitGraphQLContext & ImplicitMercuriusContext;

const mockUserParent: User = {
	id: "user123",
	role: "regular",
} as unknown as User;

describe("orgIdWhereMembershipRequested", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		const unauthenticatedCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as ExplicitGraphQLContext & ImplicitMercuriusContext;

		try {
			await resolveOrgIdWhereMembershipRequested(
				mockUserParent,
				{},
				unauthenticatedCtx,
			);
			expect.fail("Expected function to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect((error as TalawaGraphQLError).extensions.code).toBe(
				"unauthenticated",
			);
		}
	});

	test("throws an unauthenticated error if current user is not found", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		try {
			await resolveOrgIdWhereMembershipRequested(
				mockUserParent,
				{},
				baseMockCtx,
			);
			expect.fail("Expected function to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect((error as TalawaGraphQLError).extensions.code).toBe(
				"unauthenticated",
			);
		}
	});

	test("throws an unauthorized error if a non-administrator queries another user's membership requests", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});

		const anotherUserParent = {
			id: "anotherUser",
			role: "regular",
		} as unknown as User;

		try {
			await resolveOrgIdWhereMembershipRequested(
				anotherUserParent,
				{},
				baseMockCtx,
			);
			expect.fail("Expected function to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect((error as TalawaGraphQLError).extensions.code).toBe(
				"unauthorized_action",
			);
		}
	});

	test("allows administrator to query another user's membership requests", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "admin123",
			role: "administrator",
		});

		const adminCtx = {
			...baseMockCtx,
			currentClient: {
				isAuthenticated: true,
				user: { id: "admin123", role: "administrator" },
			},
		} as ExplicitGraphQLContext & ImplicitMercuriusContext;

		const anotherUserParent = {
			id: "anotherUser",
			role: "regular",
		} as unknown as User;

		const result = await resolveOrgIdWhereMembershipRequested(
			anotherUserParent,
			{},
			adminCtx,
		);

		expect(result).toEqual(["org1", "org2"]);
		expect(
			mockDrizzleClient.query.membershipRequestsTable.findMany,
		).toHaveBeenCalledWith({
			columns: { organizationId: true },
			where: expect.any(Function),
		});
	});

	test("returns unique organization IDs where the user has pending membership requests", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});

		const result = await resolveOrgIdWhereMembershipRequested(
			mockUserParent,
			{},
			baseMockCtx,
		);

		expect(result).toEqual(["org1", "org2"]);
		expect(result).toHaveLength(2); // Should be deduplicated
		expect(
			mockDrizzleClient.query.membershipRequestsTable.findMany,
		).toHaveBeenCalledWith({
			columns: { organizationId: true },
			where: expect.any(Function),
		});
	});

	test("returns empty array if user has no pending membership requests", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});
		mockDrizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
			[],
		);

		const result = await resolveOrgIdWhereMembershipRequested(
			mockUserParent,
			{},
			baseMockCtx,
		);

		expect(result).toEqual([]);
		expect(
			mockDrizzleClient.query.membershipRequestsTable.findMany,
		).toHaveBeenCalledWith({
			columns: { organizationId: true },
			where: expect.any(Function),
		});
	});

	test("filters only pending membership requests", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});

		await resolveOrgIdWhereMembershipRequested(mockUserParent, {}, baseMockCtx);

		// Verify that the where function is called with the correct parameters
		const calls =
			mockDrizzleClient.query.membershipRequestsTable.findMany.mock.calls;
		expect(calls).toHaveLength(1);
		const whereCallback = calls[0]?.[0]?.where;
		expect(whereCallback).toBeDefined();

		// Mock the fields and operators to verify the correct conditions are applied
		const mockFields = { userId: "userId", status: "status" };
		const mockOperators = {
			and: vi.fn((condition1: unknown, condition2: unknown) => ({
				condition1,
				condition2,
			})),
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		};

		if (whereCallback) {
			whereCallback(mockFields, mockOperators);
		}

		expect(mockOperators.and).toHaveBeenCalled();
		expect(mockOperators.eq).toHaveBeenCalledWith("userId", "user123");
		expect(mockOperators.eq).toHaveBeenCalledWith("status", "pending");
	});
});
