import { describe, it, expect, vi, beforeEach } from "vitest";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("organizationConnectionList Query", () => {
	const mockOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	const mockContext = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: vi.fn(),
				},
			},
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext.drizzleClient.query.organizationsTable.findMany.mockReset();
	});

	// Test default values
	it("should use default values when no arguments are provided", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			mockOrganizations,
		);

		const resolver = builder.getField("Query", "organizationConnectionList").resolve;
		const result = await resolver({}, {}, mockContext);

		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result).toEqual(mockOrganizations);
	});

	// Test with valid arguments
	it("should handle valid pagination arguments", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			mockOrganizations,
		);

		const resolver = builder.getField("Query", "organizationConnectionList").resolve;
		const result = await resolver({}, { first: 20, skip: 5 }, mockContext);

		expect(
			mockContext.drizzleClient.query.organizationsTable.findMany,
		).toHaveBeenCalledWith({
			limit: 20,
			offset: 5,
		});
		expect(result).toEqual(mockOrganizations);
	});

	// Test first argument validation
	it("should throw error when first argument is less than 1", async () => {
		const resolver = builder.getField("Query", "organizationConnectionList").resolve;

		await expect(resolver({}, { first: 0 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
		await expect(resolver({}, { first: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	it("should throw error when first argument is greater than 100", async () => {
		const resolver = builder.getField("Query", "organizationConnectionList").resolve;

		await expect(resolver({}, { first: 101 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test skip argument validation
	it("should throw error when skip argument is negative", async () => {
		const resolver = builder.getField("Query", "organizationConnectionList").resolve;

		await expect(resolver({}, { skip: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test error structure
	it("should return properly structured error for invalid arguments", async () => {
		const resolver = builder.getField("Query", "organizationConnectionList").resolve;

		try {
			await resolver({}, { first: -1, skip: -1 }, mockContext);
		} catch (error) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect(error.extensions).toEqual({
				code: "invalid_arguments",
				issues: expect.arrayContaining([
					expect.objectContaining({
						argumentPath: expect.any(Array),
						message: expect.any(String),
					}),
				]),
			});
		}
	});

	// Test empty results
	it("should handle empty result set", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			[],
		);

		const resolver = builder.getField("Query", "organizationConnectionList").resolve;
		const result = await resolver({}, { first: 10, skip: 0 }, mockContext);

		expect(result).toEqual([]);
	});

	// Test database error handling
	it("should propagate database errors", async () => {
		const dbError = new Error("Database connection failed");
		mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(
			dbError,
		);

		const resolver = builder.getField("Query", "organizationConnectionList").resolve;
		await expect(
			resolver({}, { first: 10, skip: 0 }, mockContext),
		).rejects.toThrow(dbError);
	});
});
