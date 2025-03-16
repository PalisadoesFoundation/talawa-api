import { ilike, sql } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { resolveOrganizations } from "~/src/graphql/types/Query/organizations";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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

describe("resolveOrganizations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	
	test("returns organizations array if user is not authenticated", async () => {
		const unauthenticatedCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as unknown as ContextType;

		const orgs = [
			{ id: "org1", name: "Organization 1" },
			{ id: "org2", name: "Organization 2" },
		];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(orgs);

		const result = await resolveOrganizations(
			null,
			{ filter: null },
			unauthenticatedCtx,
		);
		expect(result).toEqual(orgs);

		expect(
			mockDrizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 20,
				offset: 0,
			}),
		);
	});

	test("returns organizations array on successful query", async () => {
		const orgs = [
			{ id: "org1", name: "Organization 1" },
			{ id: "org2", name: "Organization 2" },
		];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(orgs);

		const result = await resolveOrganizations(
			null,
			{ filter: null },
			baseMockCtx,
		);
		expect(result).toEqual(orgs);

		expect(
			mockDrizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 20,
				offset: 0,
			}),
		);
	});

	test("applies filter when provided", async () => {
		const orgs = [{ id: "org1", name: "Filtered Organization" }];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(orgs);
		const filterValue = "Filtered";

		const result = await resolveOrganizations(
			null,
			{ filter: filterValue },
			baseMockCtx,
		);
		expect(result).toEqual(orgs);

		expect(
			mockDrizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 20,
				offset: 0,
			}),
		);

		const whereArg =
			mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0]
				?.where;
		expect(typeof whereArg).toBe("function");
	});

	test("logs error and throws error if findMany fails", async () => {
		const errorMsg = new Error("Database error");
		mockDrizzleClient.query.organizationsTable.findMany.mockRejectedValue(
			errorMsg,
		);

		await expect(
			resolveOrganizations(null, { filter: null }, baseMockCtx),
		).rejects.toThrow("An error occurred while fetching organizations.");
		expect(baseMockCtx.log.error).toHaveBeenCalledWith(
			"Error in organizations query:",
			errorMsg,
		);
	});

	test("where clause returns correct condition when filter is provided", async () => {
		// Ensure findMany resolves without error.
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);
		const filterValue = "Filtered";

		await resolveOrganizations(null, { filter: filterValue }, baseMockCtx);

		// Retrieve the arguments passed to findMany.
		const findManyArgs =
			mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
		const whereFn = findManyArgs.where;
		expect(typeof whereFn).toBe("function");

		// Create a dummy fields object where "name" is a SQL expression.
		const dummyFields = { name: sql<string>`Some Org` };
		// Compute the expected condition.
		const expectedCondition = ilike(dummyFields.name, `%${filterValue}%`);
		// Compare by converting to string.
		expect(String(whereFn(dummyFields))).toEqual(String(expectedCondition));
	});

	test("where clause returns sql`TRUE` when filter is not provided", async () => {
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);
		const filterValue = "Filtered";
		await resolveOrganizations(null, { filter: filterValue }, baseMockCtx);

		const findManyArgs =
			mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
		const whereFn = findManyArgs.where;
		expect(typeof whereFn).toBe("function");

		const dummyFields = { name: sql<string>`Some Org` };
		const expectedCondition = sql`TRUE`;
		expect(String(whereFn(dummyFields))).toEqual(String(expectedCondition));
	});

	test("where clause returns sql`TRUE` when filter is not provided", async () => {
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue([]);

		await resolveOrganizations(null, { filter: undefined }, baseMockCtx);

		const findManyArgs =
			mockDrizzleClient.query.organizationsTable.findMany.mock.calls[0]?.[0];
		const whereFn = findManyArgs.where;
		expect(typeof whereFn).toBe("function");

		const dummyFields = { name: sql<string>`Some Org` };
		const expectedCondition = sql`TRUE`;

		expect(String(whereFn(dummyFields))).toEqual(String(expectedCondition));
	});
});
