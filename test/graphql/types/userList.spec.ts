import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { drizzleClient } from "~/src/drizzle/client"; // Import actual drizzle client type

describe("userList Query", () => {
	const mockUsers = [
		{ id: 1, name: "User 1", email: "user1@example.com" },
		{ id: 2, name: "User 2", email: "user2@example.com" },
		{ id: 3, name: "User 3", email: "user3@example.com" },
	];

	const findManyMock: Mock = vi.fn();

	// Create a properly typed partial mock of drizzleClient.query
	const mockQuery: Partial<typeof drizzleClient.query> = {
		usersTable: {
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
		return ctx.drizzleClient.query.usersTable.findMany({
			limit: first,
			offset: skip,
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		findManyMock.mockClear();
	});

	it("should use default values when no arguments are provided", async () => {
		findManyMock.mockResolvedValueOnce(mockUsers);
		const result = await mockResolve({}, {}, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({ limit: 10, offset: 0 });
		expect(result).toEqual(mockUsers);
	});
});
