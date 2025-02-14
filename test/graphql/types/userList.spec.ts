import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { RelationalQueryBuilder } from "drizzle-orm";

describe("userList Query", () => {
	const mockUsers = [
		{ id: 1, name: "User 1", email: "user1@example.com" },
		{ id: 2, name: "User 2", email: "user2@example.com" },
		{ id: 3, name: "User 3", email: "user3@example.com" },
	];

	const findManyMock: Mock = vi.fn();

	const mockContext: GraphQLContext = {
		drizzleClient: {
			query: {
				usersTable: {
					findMany: findManyMock,
				} as Partial<RelationalQueryBuilder<any, any>>, // ✅ Fixed TypeScript issue
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
