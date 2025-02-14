import { describe, it, expect, vi, beforeEach } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "~/src/graphql/context";

describe("organizationConnectionList Query", () => {
	const mockOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	const mockContext: Pick<GraphQLContext, "drizzleClient"> = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: vi.fn(),
				},
			},
		},
	};

	let resolver: (
		parent: unknown,
		args: { first?: number; skip?: number },
		context: Pick<GraphQLContext, "drizzleClient">,
	) => Promise<unknown>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext.drizzleClient.query.organizationsTable.findMany.mockReset();
	});

	// Test default values
	it("should use default values when no arguments are provided", async () => {
		mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			mockOrganizations,
		);

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
		await expect(resolver({}, { first: 0 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
		await expect(resolver({}, { first: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	it("should throw error when first argument is greater than 100", async () => {
		await expect(resolver({}, { first: 101 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test skip argument validation
	it("should throw error when skip argument is negative", async () => {
		await expect(resolver({}, { skip: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test error structure
	it("should return properly structured error for invalid arguments", async () => {
		try {
			await resolver({}, { first: -1, skip: -1 }, mockContext);
			// If we reach here, the test should fail
			expect(true).toBe(false);
		} catch (err) {
			const error = err as TalawaGraphQLError;
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

		const result = await resolver({}, { first: 10, skip: 0 }, mockContext);

		expect(result).toEqual([]);
	});

	// Test database error handling
	it("should propagate database errors", async () => {
		const dbError = new Error("Database connection failed");
		mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(
			dbError,
		);

		await expect(
			resolver({}, { first: 10, skip: 0 }, mockContext),
		).rejects.toThrow(dbError);
	});
});
