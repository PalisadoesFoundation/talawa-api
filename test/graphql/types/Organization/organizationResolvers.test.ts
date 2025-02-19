import { execute, parse } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { schema } from "~/src/graphql/schema";

describe("organizationConnectionList Query", () => {
	// Mock context
	const mockContext = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: vi.fn(),
				},
			},
		},
	};

	// Sample organization data
	const sampleOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
		mockContext.drizzleClient.query.organizationsTable.findMany.mockReset();
	});

	const executeQuery = async (query: string, variables = {}) => {
		return execute({
			schema,
			document: parse(query),
			contextValue: mockContext,
			variableValues: variables,
		});
	};

	it("should return organizations with default pagination values", async () => {
		// Arrange
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			sampleOrganizations,
		);

		const query = `
			query {
				organizationConnectionList {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(
			sampleOrganizations,
		);
		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith({
			limit: 10, // default value
			offset: 0, // default value
		});
	});

	it("should return organizations with custom pagination values", async () => {
		// Arrange
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			sampleOrganizations,
		);

		const query = `
			query($first: Int, $skip: Int) {
				organizationConnectionList(first: $first, skip: $skip) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query, { first: 5, skip: 10 });

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(
			sampleOrganizations,
		);
		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith({
			limit: 5,
			offset: 10,
		});
	});

	it("should throw error when first argument is less than 1", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(first: 0) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("should throw error when first argument is greater than 100", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(first: 101) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("should throw error when skip argument is negative", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(skip: -1) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("should handle database errors gracefully", async () => {
		// Arrange
		const dbError = new Error("Database connection failed");
		mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(
			dbError,
		);

		const query = `
			query {
				organizationConnectionList {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.message).toBe("Database connection failed");
	});

	it("should verify error object structure when validation fails", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(first: 0, skip: -1) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
				issues: expect.arrayContaining([
					expect.objectContaining({
						argumentPath: expect.any(Array),
						message: expect.any(String),
					}),
				]),
			},
		});
	});
});
