import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { resolveOrgsWhereUserIsBlocked } from "~/src/graphql/types/User/orgsWhereUserIsBlocked";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const noCursorArgs = { first: 10 };

const globalArgs = {
	after: Buffer.from(
		JSON.stringify({
			createdAt: new Date().toISOString(),
			organizationId: "67378abd-8500-8f17-1cf2-990d00000005",
		}),
	).toString("base64url"),
	first: 10,
};

const reverseCursorStr = Buffer.from(
	JSON.stringify({
		createdAt: new Date().toISOString(),
		organizationId: "67378abd-8500-8f17-1cf2-990d00000005",
	}),
).toString("base64url");

const reverseArgs = {
	before: reverseCursorStr,
	last: 10,
};

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();

const mockDrizzleClient = {
	query: {
		blockedUsersTable: {
			findMany: mockFindMany,
		},
		usersTable: {
			findFirst: mockFindFirst,
		},
	},
};

const baseMockCtx = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "user123", role: "member" },
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
} as unknown as ExplicitGraphQLContext & ImplicitMercuriusContext;

const mockUserParent: User = {
	id: "user123",
	role: "administrator",
} as unknown as User;

describe("resolveOrgsWhereUserIsBlocked", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFindMany.mockResolvedValue([
			{
				createdAt: new Date(),
				organizationId: "org1",
				organization: { id: "org1", name: "Test Organization" },
			},
		]);
		mockFindFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		const unauthenticatedCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as ExplicitGraphQLContext & ImplicitMercuriusContext;

		await expect(
			resolveOrgsWhereUserIsBlocked(
				mockUserParent,
				noCursorArgs,
				unauthenticatedCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("returns organizations where the user is blocked", async () => {
		const expectedWhere = eq(blockedUsersTable.userId, mockUserParent.id);
		const expectedOrderBy = [
			desc(blockedUsersTable.createdAt),
			desc(blockedUsersTable.organizationId),
		];

		const result = await resolveOrgsWhereUserIsBlocked(
			mockUserParent,
			noCursorArgs,
			baseMockCtx,
		);

		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				columns: {
					createdAt: true,
					organizationId: true,
				},
				limit: 11,
				orderBy: expectedOrderBy,
				with: { organization: true, user: true },
				where: expectedWhere,
			}),
		);

		expect(result).toBeDefined();
		expect(result).toMatchObject({
			edges: expect.any(Array),
			pageInfo: expect.any(Object),
		});
		expect(result.edges.length).toBeGreaterThan(0);
		expect(result.edges[0]?.node).toEqual({
			id: "org1",
			organization: {
				id: "org1",
				name: "Test Organization",
			},
			user: undefined,
			createdAt: expect.any(Date),
		});
	});

	test("applies cursor-based pagination correctly for forward pagination", async () => {
		const cursorStr = globalArgs.after;
		const cursorData = JSON.parse(
			Buffer.from(cursorStr, "base64url").toString("utf-8"),
		);
		const cursorDate = new Date(cursorData.createdAt);
		const cursorOrgId = cursorData.organizationId;

		const expectedWhere = and(
			eq(blockedUsersTable.userId, mockUserParent.id),
			or(
				and(
					eq(blockedUsersTable.createdAt, cursorDate),
					lt(blockedUsersTable.organizationId, cursorOrgId),
				),
				lt(blockedUsersTable.createdAt, cursorDate),
			),
		);

		const expectedOrderBy = [
			desc(blockedUsersTable.createdAt),
			desc(blockedUsersTable.organizationId),
		];

		const result = await resolveOrgsWhereUserIsBlocked(
			mockUserParent,
			globalArgs,
			baseMockCtx,
		);

		const mockedFindMany = vi.mocked(mockFindMany);
		expect(mockedFindMany).toHaveBeenCalled();
		const callArgs = mockedFindMany.mock.calls[0]?.[0];

		expect(callArgs.where).toBeDefined();
		expect(callArgs.where?.toString().trim()).toBe(
			expectedWhere?.toString().trim(),
		);
		expect(callArgs.orderBy).toEqual(expectedOrderBy);
		expect(result).toBeDefined();
	});

	test("applies reverse pagination with before cursor correctly", async () => {
		const cursorData = JSON.parse(
			Buffer.from(reverseCursorStr, "base64url").toString("utf-8"),
		);
		const cursorDate = new Date(cursorData.createdAt);
		const cursorOrgId = cursorData.organizationId;

		const expectedWhere = and(
			eq(blockedUsersTable.userId, mockUserParent.id),
			or(
				and(
					eq(blockedUsersTable.createdAt, cursorDate),
					gt(blockedUsersTable.organizationId, cursorOrgId),
				),
				gt(blockedUsersTable.createdAt, cursorDate),
			),
		);

		const expectedOrderBy = [
			asc(blockedUsersTable.createdAt),
			asc(blockedUsersTable.organizationId),
		];

		const result = await resolveOrgsWhereUserIsBlocked(
			mockUserParent,
			reverseArgs,
			baseMockCtx,
		);

		const mockedFindMany = vi.mocked(mockFindMany);
		expect(mockedFindMany).toHaveBeenCalled();
		const callArgs = mockedFindMany.mock.calls[0]?.[0];

		expect(callArgs.where).toBeDefined();
		expect(callArgs.where?.toString().trim()).toBe(
			expectedWhere?.toString().trim(),
		);
		expect(callArgs.orderBy).toEqual(expectedOrderBy);
		expect(result).toBeDefined();
	});

	test("throws an unauthorized error if a non-administrator queries another user's blocked organizations", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const anotherUserParent = {
			id: "anotherUser",
			role: "member",
		} as unknown as User;

		await expect(
			resolveOrgsWhereUserIsBlocked(
				anotherUserParent,
				noCursorArgs,
				baseMockCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);

		expect(mockFindMany).not.toHaveBeenCalled();
	});

	test("throws arguments_associated_resources_not_found error for stale cursor", async () => {
		// Simulate a valid cursor but no rows found
		mockFindMany.mockResolvedValueOnce([]);

		await expect(
			resolveOrgsWhereUserIsBlocked(mockUserParent, globalArgs, baseMockCtx),
		).rejects.toMatchObject({
			extensions: { code: "arguments_associated_resources_not_found" },
		});
	});

	test("throws an unauthorized error if a non-administrator queries their own blocked organizations", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member", // non-admin
		});

		const selfUserParent = {
			id: "user123",
			role: "member",
		} as unknown as User;

		await expect(
			resolveOrgsWhereUserIsBlocked(selfUserParent, noCursorArgs, baseMockCtx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(mockFindMany).not.toHaveBeenCalled();
	});

	test("throws invalid arguments error for invalid cursor", async () => {
		const invalidArgs = { first: 10, after: "invalid-cursor" };

		await expect(
			resolveOrgsWhereUserIsBlocked(mockUserParent, invalidArgs, baseMockCtx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(mockFindMany).not.toHaveBeenCalled();
	});

	test("throws unauthenticated error when currentUser lookup returns undefined", async () => {
		// Simulate authenticated session but user not found in DB
		mockFindFirst.mockResolvedValueOnce(undefined);

		await expect(
			resolveOrgsWhereUserIsBlocked(mockUserParent, noCursorArgs, baseMockCtx),
		).rejects.toThrow(TalawaGraphQLError);

		expect(mockFindMany).not.toHaveBeenCalled();
	});

	test("allows administrator to access another user's blocked organizations", async () => {
		// Administrator accessing another user's data
		mockFindFirst.mockResolvedValueOnce({
			id: "adminUser123",
			role: "administrator",
		});

		const anotherUserParent = {
			id: "differentUser",
			role: "member",
		} as unknown as User;

		const adminCtx = {
			...baseMockCtx,
			currentClient: {
				isAuthenticated: true,
				user: { id: "adminUser123", role: "administrator" },
			},
		} as ExplicitGraphQLContext & ImplicitMercuriusContext;

		const result = await resolveOrgsWhereUserIsBlocked(
			anotherUserParent,
			noCursorArgs,
			adminCtx,
		);

		expect(result).toBeDefined();
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: eq(blockedUsersTable.userId, anotherUserParent.id),
			}),
		);
	});
});
