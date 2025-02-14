import { execute, parse } from "graphql";
import { schema } from "~/src/graphql/schema";
import { mockContext } from "~/src/test/mockContext";

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
		variableValues: variables,
		contextValue: mockContext,
	});
};

describe("User List GraphQL Query", () => {
	const mockUsers = [
		{ id: "1", name: "John Doe", email: "john@example.com" },
		{ id: "2", name: "Jane Doe", email: "jane@example.com" },
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

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

	it("should return users with custom pagination values", async () => {
		mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(mockUsers);

		const result = await executeOperation({ first: 5, skip: 2 });

		expect(result.errors).toBeUndefined();
		expect(result.data?.userList).toEqual(mockUsers);
		expect(mockContext.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 2,
		});
	});

	it("should return an error if arguments are invalid", async () => {
		const result = await executeOperation({ first: -1, skip: -5 });

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("Invalid arguments");
		expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	it("should return unauthorized error if user is not authenticated", async () => {
		const testContext = {
			...mockContext,
			currentClient: { isAuthenticated: false, user: null },
		};

		const result = await execute({
			schema,
			document: parse("query { userList { id name email } }"),
			contextValue: testContext,
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("User is not authorized");
		expect(testContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	it("should return unauthorized error if user lacks admin privileges", async () => {
		const testContext = {
			...mockContext,
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-123", role: "regular" },
			},
		};

		const result = await execute({
			schema,
			document: parse("query { userList { id name email } }"),
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
	});
});
