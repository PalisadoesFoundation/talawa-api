import { expect, suite, test, vi } from "vitest";
import {
	type ParsedDefaultGraphQLConnectionArguments,
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "../../src/utilities/defaultGraphQLConnection";

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
			expect(result.pageInfo.startCursor).toBe("4");
			expect(result.pageInfo.endCursor).toBe("1");
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
			expect(result.pageInfo.startCursor).toBe("5");
			expect(result.pageInfo.endCursor).toBe("1");
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
			expect(result.pageInfo.startCursor).toBe("5");
			expect(result.pageInfo.endCursor).toBe("3");
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
			expect(result.pageInfo.startCursor).toBe("1");
			expect(result.pageInfo.endCursor).toBe("4");
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
			expect(result.pageInfo.startCursor).toBe("1");
			expect(result.pageInfo.endCursor).toBe("5");
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
			expect(result.pageInfo.startCursor).toBe("1");
			expect(result.pageInfo.endCursor).toBe("2");
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

			// Verify we can decode the cursor back
			const decodedCursor = JSON.parse(
				Buffer.from(result.edges[0]?.cursor || "", "base64url").toString(
					"utf-8",
				),
			);
			expect(decodedCursor).toHaveProperty("id", "1");
			expect(decodedCursor).toHaveProperty("createdAt");
		});
	});
});
