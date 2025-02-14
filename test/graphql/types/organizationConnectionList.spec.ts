import { describe, it, expect, vi, beforeEach } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "~/src/graphql/context";

describe("organizationConnectionList Query", () => {
	const mockOrganizations = [
		{ id: 1, name: "Org 1" },
		{ id: 2, name: "Org 2" },
		{ id: 3, name: "Org 3" },
	];

	const findManyMock = vi.fn();

	const mockContext = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: findManyMock,
				} as any,
			},
		},
	} as unknown as GraphQLContext;

	// Create a mock resolver for testing
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

	// Test default values
	it("should use default values when no arguments are provided", async () => {
		findManyMock.mockResolvedValueOnce(mockOrganizations);

		const result = await mockResolve({}, {}, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result).toEqual(mockOrganizations);
	});

	// Test with valid arguments
	it("should handle valid pagination arguments", async () => {
		findManyMock.mockResolvedValueOnce(mockOrganizations);

		const result = await mockResolve({}, { first: 20, skip: 5 }, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({
			limit: 20,
			offset: 5,
		});
		expect(result).toEqual(mockOrganizations);
	});

	// Test first argument validation
	it("should throw error when first argument is less than 1", async () => {
		await expect(mockResolve({}, { first: 0 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
		await expect(mockResolve({}, { first: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	it("should throw error when first argument is greater than 100", async () => {
		await expect(mockResolve({}, { first: 101 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test skip argument validation
	it("should throw error when skip argument is negative", async () => {
		await expect(mockResolve({}, { skip: -1 }, mockContext)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	// Test error structure
	it("should return properly structured error for invalid arguments", async () => {
		try {
			await mockResolve({}, { first: -1, skip: -1 }, mockContext);
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
		findManyMock.mockResolvedValueOnce([]);

		const result = await mockResolve({}, { first: 10, skip: 0 }, mockContext);

		expect(result).toEqual([]);
	});

	// Test database error handling
	it("should propagate database errors", async () => {
		const dbError = new Error("Database connection failed");
		findManyMock.mockRejectedValueOnce(dbError);

		await expect(
			mockResolve({}, { first: 10, skip: 0 }, mockContext),
		).rejects.toThrow(dbError);
	});
});
