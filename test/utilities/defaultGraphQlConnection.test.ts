import { afterEach, expect, suite, test, vi } from "vitest";
import { z } from "zod";
import {
	createGraphQLConnectionWithWhereSchema,
	defaultGraphQLConnectionArgumentsSchema,
	type ParsedDefaultGraphQLConnectionArguments,
	transformDefaultGraphQLConnectionArguments,
	transformGraphQLConnectionArgumentsWithWhere,
	transformToDefaultGraphQLConnection,
} from "../../src/utilities/graphqlConnection";

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Helper function to decode base64url-encoded cursors for test assertions.
 * The implementation encodes cursors as base64url(JSON.stringify(cursor)).
 */
const decodeCursor = (encodedCursor: string): string => {
	return JSON.parse(Buffer.from(encodedCursor, "base64url").toString("utf-8"));
};

suite("defaultGraphQLConnection utilities", () => {
	suite("defaultGraphQLConnectionArgumentsSchema", () => {
		test("returns valid schema output for first/after pattern", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				first: 10,
				after: "someCursor",
				before: null,
				last: null,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					first: 10,
					after: "someCursor",
					before: undefined,
					last: undefined,
				});
			}
		});

		test("returns valid schema output for last/before pattern", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				last: 10,
				before: "someCursor",
				first: null,
				after: null,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					last: 10,
					before: "someCursor",
					first: undefined,
					after: undefined,
				});
			}
		});

		test("validates minimum value for first", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				first: 0,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				expect(result.error.issues[0]?.path).toContain("first");
			}
		});

		test("validates maximum value for first", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				first: 33,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("first");
			}
		});

		test("validates minimum value for last", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				last: 0,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("last");
			}
		});

		test("validates maximum value for last", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				last: 33,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("last");
			}
		});

		test("converts null values to undefined", () => {
			const result = defaultGraphQLConnectionArgumentsSchema.safeParse({
				first: null,
				after: null,
				before: null,
				last: null,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					first: undefined,
					after: undefined,
					before: undefined,
					last: undefined,
				});
			}
		});
	});

	suite("transformDefaultGraphQLConnectionArguments", () => {
		test("transforms first/after arguments correctly", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					first: 10,
					after: "someCursor",
					before: undefined,
					last: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11, // first + 1
				isInversed: false,
				cursor: "someCursor",
			});
		});

		test("transforms first without after arguments correctly", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					first: 10,
					after: undefined,
					before: undefined,
					last: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11, // first + 1
				isInversed: false,
				cursor: undefined,
			});
		});

		test("transforms last/before arguments correctly", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					last: 10,
					before: "someCursor",
					first: undefined,
					after: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11, // last + 1
				isInversed: true,
				cursor: "someCursor",
			});
		});

		test("transforms last without before arguments correctly", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					last: 10,
					before: undefined,
					first: undefined,
					after: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11, // last + 1
				isInversed: true,
				cursor: undefined,
			});
		});

		test("errors when both first and last are provided", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					first: 10,
					last: 5,
					after: undefined,
					before: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["last"],
				}),
			);
			expect(result.cursor).toBe(undefined);
		});

		test("errors when first is provided with before", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					first: 10,
					before: "someCursor",
					after: undefined,
					last: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["before"],
				}),
			);
			expect(result.cursor).toBe(undefined);
		});

		test("errors when last is provided with after", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					last: 10,
					after: "someCursor",
					before: undefined,
					first: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["after"],
				}),
			);
			expect(result.cursor).toBe(undefined);
		});

		test("errors when neither first nor last is provided", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformDefaultGraphQLConnectionArguments(
				{
					first: undefined,
					last: undefined,
					after: undefined,
					before: undefined,
				},
				ctx,
			);

			expect(ctx.addIssue).toHaveBeenCalledTimes(2);
			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["first"],
				}),
			);
			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["last"],
				}),
			);
			expect(result.cursor).toBe(undefined);
		});

		test("preserves custom arguments", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const customArgs = {
				first: 10,
				after: undefined,
				before: undefined,
				last: undefined,
				name: "test",
				role: "admin",
			};
			const result = transformDefaultGraphQLConnectionArguments(
				customArgs,
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11,
				isInversed: false,
				cursor: undefined,
				name: "test",
				role: "admin",
			});
		});
	});

	suite("transformToDefaultGraphQLConnection", () => {
		// Mock data for testing
		const mockUsers = [
			{ id: "1", name: "User 1", createdAt: new Date("2025-01-01") },
			{ id: "2", name: "User 2", createdAt: new Date("2025-01-02") },
			{ id: "3", name: "User 3", createdAt: new Date("2025-01-03") },
			{ id: "4", name: "User 4", createdAt: new Date("2025-01-04") },
			{ id: "5", name: "User 5", createdAt: new Date("2025-01-05") },
		];

		test("transforms forward pagination with hasNextPage=true", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 5, // We provide 5 items, so hasNextPage should be true
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [...mockUsers],
			});

			expect(result.edges).toHaveLength(4); // Should drop the extra node
			expect(result.edges[0]?.node.id).toBe("1");
			expect(result.edges[3]?.node.id).toBe("4");
			expect(result.pageInfo.hasNextPage).toBe(true);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("1");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("4");
		});

		test("transforms forward pagination with hasNextPage=false", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 6, // We provide 5 items, so hasNextPage should be false
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [...mockUsers],
			});

			expect(result.edges).toHaveLength(5);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("1");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("5");
		});

		test("transforms forward pagination with cursor (hasPreviousPage=true)", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: "2",
				isInversed: false,
				limit: 4,
			};

			// Simulate DB query result after a cursor
			const afterCursorUsers = mockUsers.slice(2);

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: afterCursorUsers,
			});

			expect(result.edges).toHaveLength(3);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(true);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("3");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("5");
		});

		test("transforms backward pagination with hasPreviousPage=true", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: true,
				limit: 5, // We provide 5 items, so hasPreviousPage should be true
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [...mockUsers],
			});

			expect(result.edges).toHaveLength(4); // Should drop the extra node
			expect(result.edges[0]?.node.id).toBe("4"); // Backward, so reversed order
			expect(result.edges[3]?.node.id).toBe("1");
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(true);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("4");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("1");
		});

		test("transforms backward pagination with hasPreviousPage=false", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: true,
				limit: 6, // We provide 5 items, so hasPreviousPage should be false
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [...mockUsers],
			});

			expect(result.edges).toHaveLength(5);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("5");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("1");
		});

		test("transforms backward pagination with cursor (hasNextPage=true)", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: "4",
				isInversed: true,
				limit: 3,
			};

			// Simulate DB query result before a cursor
			const beforeCursorUsers = mockUsers.slice(0, 3);

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: beforeCursorUsers,
			});

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node.id).toBe("2");
			expect(result.edges[1]?.node.id).toBe("1");
			expect(result.pageInfo.hasNextPage).toBe(true);
			expect(result.pageInfo.hasPreviousPage).toBe(true);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("2");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("1");
		});

		test("handles empty results", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: "nonexistent",
				isInversed: false,
				limit: 10,
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user: { id: string }) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [],
			});

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(true); // Has previous since cursor was provided
			expect(result.pageInfo.startCursor).toBe(null);
			expect(result.pageInfo.endCursor).toBe(null);
		});

		test("handles empty results with backward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: "nonexistent",
				isInversed: true,
				limit: 10,
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user: { id: string }) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [],
			});

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(true); // Has next since cursor was provided
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBe(null);
			expect(result.pageInfo.endCursor).toBe(null);
		});

		test("supports node transformation", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 3,
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				// Transform node to include only name
				createNode: (user) => ({ name: user.name }),
				parsedArgs,
				rawNodes: mockUsers.slice(0, 2),
			});

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node).toEqual({ name: "User 1" });
			expect(result.edges[1]?.node).toEqual({ name: "User 2" });
		});

		test("supports custom cursor generation", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 3,
			};

			const result = transformToDefaultGraphQLConnection({
				// Create base64 cursor from combined id and createdAt
				createCursor: (user) =>
					Buffer.from(
						JSON.stringify({
							id: user.id,
							createdAt: user.createdAt.toISOString(),
						}),
					).toString("base64url"),
				createNode: (user) => user,
				parsedArgs,
				rawNodes: mockUsers.slice(0, 2),
			});

			expect(result.edges).toHaveLength(2);
			// Verify cursor is base64 encoded
			expect(result.edges[0]?.cursor).toMatch(/^[A-Za-z0-9_-]+$/);

			// Double-decode: implementation wraps createCursor output in JSON.stringify + base64
			const innerCursor = JSON.parse(
				Buffer.from(
					decodeCursor(result.edges[0]?.cursor ?? ""),
					"base64url",
				).toString("utf-8"),
			);
			expect(innerCursor).toHaveProperty("id", "1");
			expect(innerCursor).toHaveProperty("createdAt");
		});

		test("handles single item in results with forward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 2,
			};

			const singleUser = mockUsers[0];
			if (!singleUser) throw new Error("Test data missing");

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [singleUser],
			});

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node.id).toBe("1");
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("1");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("1");
		});

		test("handles single item in results with backward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: true,
				limit: 2,
			};

			const singleUser = mockUsers[0];
			if (!singleUser) throw new Error("Test data missing");

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [singleUser],
			});

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node.id).toBe("1");
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(decodeCursor(result.pageInfo.startCursor ?? "")).toBe("1");
			expect(decodeCursor(result.pageInfo.endCursor ?? "")).toBe("1");
		});

		test("handles exactly limit items (boundary condition) with forward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 4, // Exactly 3 items + 1 for hasNext check
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: mockUsers.slice(0, 3),
			});

			expect(result.edges).toHaveLength(3);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		test("handles exactly limit items (boundary condition) with backward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: true,
				limit: 4, // Exactly 3 items + 1 for hasPrevious check
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: mockUsers.slice(0, 3),
			});

			expect(result.edges).toHaveLength(3);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		test("handles empty results without cursor in forward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: false,
				limit: 10,
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user: { id: string }) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [],
			});

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBe(null);
			expect(result.pageInfo.endCursor).toBe(null);
		});

		test("handles empty results without cursor in backward pagination", () => {
			const parsedArgs: ParsedDefaultGraphQLConnectionArguments = {
				cursor: undefined,
				isInversed: true,
				limit: 10,
			};

			const result = transformToDefaultGraphQLConnection({
				createCursor: (user: { id: string }) => user.id,
				createNode: (user) => user,
				parsedArgs,
				rawNodes: [],
			});

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBe(null);
			expect(result.pageInfo.endCursor).toBe(null);
		});
	});

	suite("createGraphQLConnectionWithWhereSchema", () => {
		test("creates schema with custom where schema", () => {
			const whereSchema = z.object({
				name: z.string().optional(),
				role: z.string().optional(),
			});

			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);
			const result = schema.safeParse({
				first: 10,
				after: null,
				before: null,
				last: null,
				where: { name: "test" },
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.where).toEqual({ name: "test" });
				expect(result.data.first).toBe(10);
			}
		});

		test("validates where clause against provided schema", () => {
			const whereSchema = z.object({
				age: z.number(),
			});

			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);
			const result = schema.safeParse({
				first: 10,
				where: { age: "invalid" }, // Should fail - age must be number
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("where");
			}
		});

		test("defaults where to empty object when not provided", () => {
			const whereSchema = z.object({
				name: z.string().optional(),
			});

			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);
			const result = schema.safeParse({
				first: 10,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.where).toEqual({});
			}
		});

		test("handles nullable where clause", () => {
			const whereSchema = z.object({
				name: z.string().optional(),
			});

			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);
			const result = schema.safeParse({
				first: 10,
				where: null,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				// nullable() means null is converted to null, not to default value
				expect(result.data.where).toBe(null);
			}
		});

		test("preserves connection argument validation with where schema", () => {
			const whereSchema = z.object({
				name: z.string().optional(),
			});

			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);
			const result = schema.safeParse({
				first: 0, // Invalid - must be >= 1
				where: { name: "test" },
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("first");
			}
		});
	});

	suite("transformGraphQLConnectionArgumentsWithWhere", () => {
		test("transforms connection arguments and preserves where clause", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					first: 10,
					after: "cursor",
					before: undefined,
					last: undefined,
					where: { name: "test", role: "admin" },
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11,
				isInversed: false,
				cursor: "cursor",
				where: { name: "test", role: "admin" },
			});
		});

		test("transforms last/before with where clause", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					last: 5,
					before: "beforeCursor",
					first: undefined,
					after: undefined,
					where: { status: "active" },
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 6,
				isInversed: true,
				cursor: "beforeCursor",
				where: { status: "active" },
			});
		});

		test("propagates validation errors from base transformer", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					first: 10,
					last: 5, // Invalid - both first and last provided
					after: undefined,
					before: undefined,
					where: { name: "test" },
				},
				ctx,
			);

			expect(ctx.addIssue).toHaveBeenCalledWith(
				expect.objectContaining({
					path: ["last"],
				}),
			);
			expect(result.where).toEqual({ name: "test" });
		});

		test("handles empty where clause", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					first: 10,
					after: undefined,
					before: undefined,
					last: undefined,
					where: {},
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result.where).toEqual({});
		});

		test("handles null where clause", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					first: 10,
					after: undefined,
					before: undefined,
					last: undefined,
					where: null,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result.where).toBe(null);
		});

		test("preserves custom arguments along with where clause", () => {
			const ctx = { addIssue: vi.fn(), path: [] };
			const result = transformGraphQLConnectionArgumentsWithWhere(
				{
					first: 10,
					after: undefined,
					before: undefined,
					last: undefined,
					where: { name: "test" },
					customField: "customValue",
					anotherField: 123,
				},
				ctx,
			);

			expect(ctx.addIssue).not.toHaveBeenCalled();
			expect(result).toEqual({
				limit: 11,
				isInversed: false,
				cursor: undefined,
				where: { name: "test" },
				customField: "customValue",
				anotherField: 123,
			});
		});
	});

	suite("Integration: Full flow schema → transform → builder", () => {
		test("full forward pagination flow with where clause", () => {
			// Define schema
			const whereSchema = z.object({
				status: z.enum(["active", "inactive"]).optional(),
			});
			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);

			// Parse arguments
			const parseResult = schema.safeParse({
				first: 3,
				after: null,
				where: { status: "active" },
			});

			expect(parseResult.success).toBe(true);
			if (!parseResult.success) return;

			// Transform arguments
			const transformResult = schema.transform(
				transformGraphQLConnectionArgumentsWithWhere,
			);
			const parsedArgs = transformResult.parse({
				first: 3,
				after: null,
				before: null,
				last: null,
				where: { status: "active" },
			});

			// Mock data
			const mockData = [
				{ id: "1", name: "User 1", status: "active" },
				{ id: "2", name: "User 2", status: "active" },
				{ id: "3", name: "User 3", status: "active" },
				{ id: "4", name: "User 4", status: "active" },
			];

			// Build connection
			const connection = transformToDefaultGraphQLConnection({
				createCursor: (node) => node.id,
				createNode: (node) => node,
				parsedArgs,
				rawNodes: mockData,
			});

			expect(connection.edges).toHaveLength(3);
			expect(connection.pageInfo.hasNextPage).toBe(true);
			expect(connection.pageInfo.hasPreviousPage).toBe(false);
		});

		test("full backward pagination flow with cursor navigation", () => {
			const whereSchema = z.object({
				role: z.string().optional(),
			});
			const schema = createGraphQLConnectionWithWhereSchema(whereSchema);

			// Parse and transform for backward pagination
			const transformResult = schema.transform(
				transformGraphQLConnectionArgumentsWithWhere,
			);
			const parsedArgs = transformResult.parse({
				last: 2,
				before: "cursor3",
				first: null,
				after: null,
				where: { role: "admin" },
			});

			// Mock data (simulating DB result before cursor)
			const mockData = [
				{ id: "1", name: "User 1", role: "admin" },
				{ id: "2", name: "User 2", role: "admin" },
				{ id: "3", name: "User 3", role: "admin" },
			];

			// Build connection
			const connection = transformToDefaultGraphQLConnection({
				createCursor: (node) => node.id,
				createNode: (node) => node,
				parsedArgs,
				rawNodes: mockData,
			});

			expect(connection.edges).toHaveLength(2);
			expect(connection.pageInfo.hasNextPage).toBe(true);
			expect(connection.pageInfo.hasPreviousPage).toBe(true);
		});

		test("multi-page traversal simulation", () => {
			const schema = createGraphQLConnectionWithWhereSchema(z.object({}));
			const transformResult = schema.transform(
				transformGraphQLConnectionArgumentsWithWhere,
			);

			// Page 1
			const page1Args = transformResult.parse({
				first: 2,
				after: null,
				before: null,
				last: null,
				where: {},
			});

			const allData = [
				{ id: "1", name: "User 1" },
				{ id: "2", name: "User 2" },
				{ id: "3", name: "User 3" },
				{ id: "4", name: "User 4" },
				{ id: "5", name: "User 5" },
			];

			const page1 = transformToDefaultGraphQLConnection({
				createCursor: (node) => node.id,
				createNode: (node) => node,
				parsedArgs: page1Args,
				rawNodes: allData.slice(0, 3), // First 2 + 1 for hasNext
			});

			expect(page1.edges).toHaveLength(2);
			expect(page1.pageInfo.hasNextPage).toBe(true);
			const endCursor1 = page1.pageInfo.endCursor;

			// Page 2 - using endCursor from page 1
			const page2Args = transformResult.parse({
				first: 2,
				after: endCursor1,
				before: null,
				last: null,
				where: {},
			});

			const page2 = transformToDefaultGraphQLConnection({
				createCursor: (node) => node.id,
				createNode: (node) => node,
				parsedArgs: page2Args,
				rawNodes: allData.slice(2, 5), // Next 2 + 1
			});

			expect(page2.edges).toHaveLength(2);
			expect(page2.pageInfo.hasNextPage).toBe(true);
			expect(page2.pageInfo.hasPreviousPage).toBe(true);

			// Verify no overlap in data
			expect(page1.edges[0]?.node.id).toBe("1");
			expect(page1.edges[1]?.node.id).toBe("2");
			expect(page2.edges[0]?.node.id).toBe("3");
			expect(page2.edges[1]?.node.id).toBe("4");
		});
	});
});
