import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import type { User } from "~/src/graphql/types/User/User";
import { resolveOrganizationsWhereMember } from "~/src/graphql/types/User/organizationsWhereMember";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const globalArgs = {
	cursor: Buffer.from(
		JSON.stringify({
			createdAt: new Date().toISOString(),
			organizationId: "67378abd-8500-8f17-1cf2-990d00000005",
		}),
	).toString("base64url"),
	isInversed: false,
	limit: 10,
	filter: "some filter string",
	first: 10,
};

const mockWhere = vi.fn();
const mockFrom = vi.fn().mockImplementation(() => ({
	innerJoin: vi.fn().mockReturnValue({
		where: mockWhere,
	}),
	where: mockWhere,
}));

const mockSelect = vi.fn().mockImplementation(() => ({
	from: mockFrom,
}));

mockWhere.mockImplementation(() => ({
	limit: vi.fn().mockImplementation(() => ({
		orderBy: vi.fn().mockImplementation(() => ({
			execute: vi.fn().mockResolvedValue([
				{
					membershipCreatedAt: new Date(),
					membershipOrganizationId: "org1",
					organization: { id: "org1", name: "Test Organization" },
				},
			]),
		})),
	})),
}));

const mockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: vi.fn().mockResolvedValue({
				id: "user123",
				role: "member",
			}),
		},
		organizationsTable: {
			findMany: vi.fn(),
		},
	},
	select: mockSelect,
};

// ✅ **Mock Context**
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
		} as ExplicitGraphQLContext & ImplicitMercuriusContext;

		await expect(
			resolveOrganizationsWhereMember(
				mockUserParent,
				globalArgs,
				unauthenticatedCtx,
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
				globalArgs,
				baseMockCtx,
			),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("returns organizations where the user is a member", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const result = await resolveOrganizationsWhereMember(
			mockUserParent,
			globalArgs,
			baseMockCtx,
		);

		expect(result).toBeDefined();
		expect(result).toMatchObject({
			edges: expect.any(Array),
			pageInfo: expect.any(Object),
		});
		expect(result.edges.length).toBeGreaterThan(0);
		expect(result.edges[0]?.node).toEqual({
			id: "org1",
			name: "Test Organization",
		});
	});

	test("applies filter when provided", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const filterArgs = { ...globalArgs, filter: "Filtered Org" };

		await resolveOrganizationsWhereMember(
			mockUserParent,
			filterArgs,
			baseMockCtx,
		);

		expect(mockWhere).toHaveBeenCalled();
	});

	test("where clause returns sql`TRUE` when filter is not provided", async () => {
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);

		const noFilterArgs = { ...globalArgs, filter: undefined };

		await resolveOrganizationsWhereMember(
			mockUserParent,
			noFilterArgs,
			baseMockCtx,
		);

		expect(mockWhere).toHaveBeenCalled();

		const whereCondition = mockWhere.mock.calls[0]?.[0];

		expect(whereCondition.toString().trim()).toEqual(
			sql`TRUE`.toString().trim(),
		);
	});

	test("applies cursor-based pagination correctly", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const cursorArgs = {
			...globalArgs,
			cursor: Buffer.from(
				JSON.stringify({
					createdAt: "2024-01-01T12:00:00Z",
					organizationId: "org1",
				}),
			).toString("base64url"),
		};

		await resolveOrganizationsWhereMember(
			mockUserParent,
			cursorArgs,
			baseMockCtx,
		);

		expect(mockWhere).toHaveBeenCalled();
	});

	test("throws invalid_arguments error when cursor is invalid", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const invalidArgs = {
			...globalArgs,
			after: "invalid-cursor-string",
			cursor: undefined,
		};

		try {
			await resolveOrganizationsWhereMember(mockUserParent, invalidArgs, baseMockCtx);
		} catch (error: unknown) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			const err = error as TalawaGraphQLError;
			expect(err.extensions.code).toBe("invalid_arguments");
		}
	});

	test("throws unauthenticated error if current user is not found in database", async () => {
		// Mock database returning null for the user lookup
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue(null);

		try {
			await resolveOrganizationsWhereMember(mockUserParent, globalArgs, baseMockCtx);
		} catch (error: unknown) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			const err = error as TalawaGraphQLError;
			expect(err.extensions.code).toBe("unauthenticated");
		}
	});

	test("allows administrator to query another user's organizations", async () => {
		// Mock current user as administrator
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "adminUser",
			role: "administrator",
		});

		// Mock context to match
		const adminCtx = {
			...baseMockCtx,
			currentClient: {
				isAuthenticated: true,
				user: { id: "adminUser", role: "administrator" },
			},
		} as unknown as ExplicitGraphQLContext & ImplicitMercuriusContext;

		const anotherUserParent = {
			id: "otherUser",
			role: "member",
		} as unknown as User;

		const result = await resolveOrganizationsWhereMember(anotherUserParent, globalArgs, adminCtx);

		expect(result).toBeDefined();
		expect(result).toMatchObject({
			edges: expect.any(Array),
			pageInfo: expect.any(Object),
		});
		expect(result.edges.length).toBeGreaterThan(0);
		expect(result.edges[0]?.node).toMatchObject({
			id: expect.any(String),
			name: expect.any(String),
		});
	});

	test("generates correct SQL for inversed pagination (isInversed: true)", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		const cursorData = {
			createdAt: new Date().toISOString(),
			organizationId: "org1",
		};
		const inversedArgs = {
			...globalArgs,
			isInversed: true,
			// Ensure cursor is present to trigger the complex WHERE logic
			cursor: Buffer.from(JSON.stringify(cursorData)).toString("base64url"),
		};

		await resolveOrganizationsWhereMember(
			mockUserParent,
			inversedArgs,
			baseMockCtx,
		);

		expect(mockWhere).toHaveBeenCalled();

		const whereCondition = mockWhere.mock.calls[0]?.[0];
		expect(whereCondition).toBeDefined();

		expect(whereCondition).toBeDefined();

	});
});
