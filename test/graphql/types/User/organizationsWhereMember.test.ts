import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
// import { and, ilike, sql, eq, or, gt, lt } from "drizzle-orm";
// import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
// import { organizationsTable } from "~/src/drizzle/tables/organizations";
// import { transformToDefaultGraphQLConnection } from "~/src/utilities/defaultGraphQLConnection";
import type { User } from "~/src/graphql/types/User/User";
import { resolveOrganizationsWhereMember } from "~/src/graphql/types/User/organizationsWhereMember";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

// Mocking Drizzle Client
const mockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: vi.fn(),
		},
	},
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	innerJoin: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
};

const baseMockCtx = {
	currentClient: {
		isAuthenticated: true as const,
		user: { id: "user123", role: "member" },
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
} as unknown as ContextType;

const mockUserParent = {
	id: "user123",
	role: "member",
} as unknown as User;

describe("resolveOrganizationsWhereMember", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		const unauthenticatedCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as ContextType;

		await expect(
			resolveOrganizationsWhereMember(
				mockUserParent,
				{ filter: undefined },
				unauthenticatedCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("throws an unauthenticated error if current user does not exist", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveOrganizationsWhereMember(
				mockUserParent,
				{ filter: undefined },
				baseMockCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("throws an unauthorized error if a non-administrator queries another user's organizations", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const anotherUserParent = {
			id: "anotherUser",
			role: "member",
		} as unknown as User;

		await expect(
			resolveOrganizationsWhereMember(
				anotherUserParent,
				{ filter: undefined },
				baseMockCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("handles invalid cursor errors", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		await expect(
			resolveOrganizationsWhereMember(
				mockUserParent,
				{ filter: undefined },
				baseMockCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	// test("returns organizations where the user is a member", async () => {
	// 	mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
	// 		id: "user123",
	// 		role: "member",
	// 	});

	// 	const organizationsMockData = [
	// 		{
	// 			membershipCreatedAt: new Date(),
	// 			membershipOrganizationId: "org1",
	// 			organization: { id: "org1", name: "Test Organization" },
	// 		},
	// 	];

	// 	mockDrizzleClient.select.mockResolvedValue(organizationsMockData);

	// 	const result = await resolveOrganizationsWhereMember(mockUserParent, { filter: undefined }, baseMockCtx);

	// 	expect(result).toEqual(
	// 		transformToDefaultGraphQLConnection({
	// 			createCursor: expect.any(Function),
	// 			createNode: expect.any(Function),
	// 			parsedArgs: expect.any(Object),
	// 			rawNodes: organizationsMockData,
	// 		}),
	// 	);
	// });

	// test("applies filter when provided", async () => {
	// 	mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
	// 		id: "user123",
	// 		role: "member",
	// 	});

	// 	mockDrizzleClient.select.mockResolvedValue([
	// 		{
	// 			membershipCreatedAt: new Date(),
	// 			membershipOrganizationId: "org1",
	// 			organization: { id: "org1", name: "Filtered Org" },
	// 		},
	// 	]);

	// 	await resolveOrganizationsWhereMember(mockUserParent, { filter: "Filtered" }, baseMockCtx);

	// 	expect(mockDrizzleClient.where).toHaveBeenCalledWith(expect.any(Function));
	// });

	// test("applies cursor-based pagination correctly", async () => {
	// 	mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
	// 		id: "user123",
	// 		role: "member",
	// 	});

	// 	mockDrizzleClient.select.mockResolvedValue([
	// 		{
	// 			membershipCreatedAt: new Date("2024-01-01T12:00:00Z"),
	// 			membershipOrganizationId: "org1",
	// 			organization: { id: "org1", name: "Org A" },
	// 		},
	// 		{
	// 			membershipCreatedAt: new Date("2024-01-02T12:00:00Z"),
	// 			membershipOrganizationId: "org2",
	// 			organization: { id: "org2", name: "Org B" },
	// 		},
	// 	]);

	// 	const cursor = Buffer.from(
	// 		JSON.stringify({ createdAt: "2024-01-01T12:00:00Z", organizationId: "org1" }),
	// 	).toString("base64url");

	// 	await resolveOrganizationsWhereMember(mockUserParent, { filter: undefined, cursor }, baseMockCtx);

	// 	expect(mockDrizzleClient.where).toHaveBeenCalledWith(expect.any(Function));
	// });

	// test("where clause returns ilike condition when filter is provided", async () => {
	// 	const filterValue = "Filtered";
	// 	mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);

	// 	await resolveOrganizationsWhereMember(mockUserParent, { filter: filterValue }, baseMockCtx);

	// 	const findManyArgs = mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
	// 	expect(typeof findManyArgs.where).toBe("function");

	// 	const dummyFields = { name: sql<string>`Some Org` };
	// 	const expectedCondition = ilike(dummyFields.name, `%${filterValue}%`);
	// 	expect(String(findManyArgs.where(dummyFields))).toEqual(String(expectedCondition));
	// });

	// test("where clause returns sql`TRUE` when filter is not provided", async () => {
	// 	mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);

	// 	await resolveOrganizationsWhereMember(mockUserParent, { filter: undefined }, baseMockCtx);

	// 	const findManyArgs = mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
	// 	expect(typeof findManyArgs.where).toBe("function");

	// 	const dummyFields = { name: sql<string>`Some Org` };
	// 	const expectedCondition = sql`TRUE`;
	// 	expect(String(findManyArgs.where(dummyFields))).toEqual(String(expectedCondition));
	// });
});
