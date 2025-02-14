import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { organizationsTable } from "~/src/drizzle/schema";
import type { RelationalQueryBuilder, ExtractTablesWithRelations } from "drizzle-orm";

describe("organizationConnectionList Query", () => {
	const mockOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	const findManyMock: Mock = vi.fn();

	const mockOrganizationsTable: RelationalQueryBuilder<
		ExtractTablesWithRelations<typeof import("~/src/drizzle/schema")>,
		typeof organizationsTable
	> = {
		findMany: findManyMock,
	} as unknown as RelationalQueryBuilder<any, any>; // ✅ Correctly typed mock

	const mockContext: GraphQLContext = {
		drizzleClient: {
			query: {
				organizationsTable: mockOrganizationsTable,
			},
		},
	};

	// Mock resolver function
	const mockResolve = async (
		_parent: unknown,
		args: { first?: number; skip?: number },
		ctx: GraphQLContext,
	) => {
		const { first = 10, skip = 0 } = args;
		return ctx.drizzleClient.query.organizationsTable.findMany({
			limit: first,
			offset: skip,
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		findManyMock.mockClear();
	});

	it("should use default values when no arguments are provided", async () => {
		findManyMock.mockResolvedValueOnce(mockOrganizations);
		const result = await mockResolve({}, {}, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({ limit: 10, offset: 0 });
		expect(result).toEqual(mockOrganizations);
	});
});
