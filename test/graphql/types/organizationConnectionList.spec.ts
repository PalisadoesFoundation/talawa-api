import { execute } from "graphql";
import { parse } from "graphql";
import { schema } from "~/src/graphql/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mockOrganizations = [
	{ id: "org-1", name: "Org One" },
	{ id: "org-2", name: "Org Two" },
];

const mockContext = {
	drizzleClient: {
		query: {
			organizationsTable: {
				findMany: jest.fn(),
			},
		},
	},
};

// Helper function to execute the query
const executeQuery = async (variables?: { first?: number; skip?: number }) => {
	return execute({
		schema,
		document: parse(`
			query OrganizationList($first: Int, $skip: Int) {
				organizationConnectionList(first: $first, skip: $skip) {
					id
					name
				}
			}
		`),
		variableValues: variables,
		contextValue: mockContext,
	});
};

describe("organizationConnectionList Query", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	// ✅ Test Case 1: Returns organizations with default pagination values
	it("should return organizations with default pagination", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(mockOrganizations);

		const result = await executeQuery();

		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(mockOrganizations);
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
	});

	// ✅ Test Case 2: Returns organizations with custom pagination values
	it("should return organizations with custom pagination values", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(mockOrganizations);

		const result = await executeQuery({ first: 5, skip: 2 });

		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(mockOrganizations);
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 2,
		});
	});

	// 🚨 Test Case 3: Should return error for invalid arguments
	it("should return an error for invalid arguments", async () => {
		const result = await executeQuery({ first: -1, skip: -5 });

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("Invalid arguments");
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});

	// 🔐 Test Case 4: Should return an unauthorized error if user is not authenticated
	it("should return unauthorized error if user is not authenticated", async () => {
		const testContext = { ...mockContext, currentClient: { isAuthenticated: false, user: null } };

		const result = await execute({
			schema,
			document: parse(`
				query {
					organizationConnectionList {
						id
						name
					}
				}
			`),
			contextValue: testContext,
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("User is not authorized");
		expect(testContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});

	// 🛑 Test Case 5: Should handle database errors gracefully
	it("should return an error when the database query fails", async () => {
		const dbError = new Error("Database connection failed");
		mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(dbError);

		const result = await executeQuery();

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toContain("Database connection failed");
	});
});
