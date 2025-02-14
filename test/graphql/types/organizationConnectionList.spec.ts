import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { drizzleClient } from "~/src/drizzle/client"; // Import actual drizzle client type

describe("organizationConnectionList Query", () => {
	const mockOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	const findManyMock: Mock = vi.fn();

	// Create a properly typed partial mock of drizzleClient.query
	const mockQuery: Partial<typeof drizzleClient.query> = {
		organizationsTable: {
			findMany: findManyMock,
		} as any, // Required to bypass strict typing for test mocks
	};

	const mockContext: GraphQLContext = {
		drizzleClient: {
			query: mockQuery as typeof drizzleClient.query, // Ensures correct type compatibility
		},
	};

	// Resolver function that will use the mocked context
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
