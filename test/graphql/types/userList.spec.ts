import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("userList Query", () => {
	const mockUsers = [
		{ id: 1, name: "User 1", email: "user1@example.com" },
		{ id: 2, name: "User 2", email: "user2@example.com" },
		{ id: 3, name: "User 3", email: "user3@example.com" },
	];

	const findManyMock: Mock = vi.fn(); // ✅ Explicitly typed

	const mockContext: GraphQLContext = {
		drizzleClient: {
			query: {
				usersTable: {
					findMany: findManyMock,
				},
			},
		},
	};

	// Create a mock resolver for testing
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

	// Test default values
	it("should use default values when no arguments are provided", async () => {
		findManyMock.mockResolvedValueOnce(mockUsers);

		const result = await mockResolve({}, {}, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result).toEqual(mockUsers);
	});

	// Test with valid arguments
	it("should handle valid pagination arguments", async () => {
		findManyMock.mockResolvedValueOnce(mockUsers);

		const result = await mockResolve({}, { first: 20, skip: 5 }, mockContext);

		expect(findManyMock).toHaveBeenCalledWith({
			limit: 20,
			offset: 5,
		});
		expect(result).toEqual(mockUsers);
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
