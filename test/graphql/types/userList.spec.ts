import { type GraphQLSchema, execute, parse } from "graphql"; // Removed GraphQLError since it's unused
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";
import "~/src/graphql/schema"; // Ensure schema definitions are loaded

// Mock data
const mockUsers = [
	{ id: "1", name: "User 1", email: "user1@example.com" },
	{ id: "2", name: "User 2", email: "user2@example.com" },
	{ id: "3", name: "User 3", email: "user3@example.com" },
];

// Mock context
const mockContext = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "admin-123", role: "administrator", tokenVersion: 1 },
	},
	drizzleClient: {
		query: {
			usersTable: {
				findMany: vi.fn(),
			},
		},
	},
	log: {
		warn: vi.fn(),
	},
};

describe("userList Query", () => {
	let schema: GraphQLSchema;

	beforeEach(() => {
		vi.clearAllMocks();
		try {
			schema = builder.toSchema({});
		} catch (error) {
			console.error("Failed to build schema:", error);
			throw error;
		}
		mockContext.drizzleClient.query.usersTable.findMany.mockReset();
	});

	const executeOperation = async (variables?: { first?: number; skip?: number }) => {
		const query = `
			query UserList($first: Int, $skip: Int) {
				userList(first: $first, skip: $skip) {
					id
					name
					email
				}
			}
		`;

		return execute({
			schema,
			document: parse(query),
			contextValue: mockContext,
			variableValues: variables,
		});
	};

	it("should return users with default pagination values", async () => {
		mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(mockUsers);
		const result = await executeOperation();
		expect(result.errors).toBeUndefined();
		expect(result.data?.userList).toEqual(mockUsers);
		expect(mockContext.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
	});

	it("should throw an error when first is less than 1", async () => {
		const result = await executeOperation({ first: 0 });
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("Invalid arguments");
		expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	it("should return unauthorized error if user is not authenticated", async () => {
		const testContext = { ...mockContext, currentClient: { isAuthenticated: false, user: null } };
		const result = await execute({
			schema,
			document: parse(`query { userList { id name email } }`),
			contextValue: testContext,
		});
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toBe("User is not authenticated");
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	it("should return unauthorized error if user lacks admin privileges", async () => {
		const testContext = { ...mockContext, currentClient: { isAuthenticated: true, user: { id: "user-123", role: "regular" } } };
		const result = await execute({
			schema,
			document: parse(`query { userList { id name email } }`),
			contextValue: testContext,
		});
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toBe("User is not authorized to access this resource");
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
	});

	it("should handle database errors gracefully", async () => {
		const dbError = new Error("Database connection failed");
		mockContext.drizzleClient.query.usersTable.findMany.mockRejectedValue(dbError);
		const result = await executeOperation();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toBe("Database connection failed");
	});
});
