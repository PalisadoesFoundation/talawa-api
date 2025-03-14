import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { resolveCreatedOrganizations } from "~/src/graphql/types/User/createdOrganizations";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { User } from "~/src/graphql/types/User/User";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

const mockDrizzleClient = {
	query: {
		organizationsTable: {
			findMany: vi.fn(),
		},
	},
};


const baseMockCtx = {
	currentClient: {
		isAuthenticated: true as const,
		user: { id: "user123", role: "member" },
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
} as unknown as ContextType;


const mockUserParent: User = ({ id: "user123", role: "member" } as unknown) as User;

describe("resolveCreatedOrganizations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		
		const unauthenticatedCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as unknown as ContextType;

		await expect(
			resolveCreatedOrganizations(mockUserParent, { filter: null }, unauthenticatedCtx)
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("returns organizations array on successful query", async () => {
		const orgs = [
			{ id: "org1", name: "Organization 1" },
			{ id: "org2", name: "Organization 2" },
		];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(orgs);

		const result = await resolveCreatedOrganizations(
			mockUserParent,
			{ filter: null },
			baseMockCtx
		);
		expect(result).toEqual(orgs);

		
		expect(mockDrizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 20,
				offset: 0,
			})
		);
	});

	test("applies filter when provided", async () => {
		const orgs = [{ id: "org1", name: "Filtered Organization" }];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(orgs);
		const filterValue = "Filtered";

		const result = await resolveCreatedOrganizations(
			mockUserParent,
			{ filter: filterValue },
			baseMockCtx
		);
		expect(result).toEqual(orgs);

		
		const findManyArgs = mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
		expect(findManyArgs.limit).toBe(20);
		expect(findManyArgs.offset).toBe(0);
		expect(typeof findManyArgs.where).toBe("function");
	});

	test("logs error and throws error if findMany fails", async () => {
		const errorMsg = new Error("Database error");
		mockDrizzleClient.query.organizationsTable.findMany.mockRejectedValue(errorMsg);

		await expect(
			resolveCreatedOrganizations(mockUserParent, { filter: null }, baseMockCtx)
		).rejects.toThrow("Failed to retrieve organizations created by the user");

		expect(baseMockCtx.log.error).toHaveBeenCalledWith(
			"Error fetching created organizations:",
			errorMsg
		);
	});
});
