import { Buffer } from "node:buffer";
import { asc, desc, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionsTable } from "~/src/drizzle/tables/actions";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveActionItems } from "~/src/graphql/types/ActionItemCategory/actionItems";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock data
const mockActionItem1 = {
	id: "01234567-89ab-cdef-0123-456789abcdef", // Valid UUID
	categoryId: "category-1",
	assignedAt: new Date("2024-01-01T10:00:00Z"),
	isCompleted: false,
	preCompletionNotes: null,
	postCompletionNotes: null,
	completionAt: null,
	assigneeId: "user-1",
	creatorId: "user-admin",
	eventId: null,
	organizationId: "org-1",
	createdAt: new Date("2024-01-01T09:00:00Z"),
	updatedAt: null,
	updaterId: null,
};

const mockParent: ActionItemCategoryType = {
	id: "category-1",
	name: "Test Category",
	description: "Test category description",
	isDisabled: false,
	createdAt: new Date("2024-01-01T00:00:00Z"),
	updatedAt: new Date("2024-01-01T00:00:00Z"),
	creatorId: "user-admin",
	updaterId: null,
	organizationId: "org-1",
};

describe("ActionItemCategory.actionItems resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-1",
		);
		ctx = context;
		mocks = newMocks;

		// Mock the select method for exists queries
		const mockSelect = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		ctx.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				resolveActionItems(mockParent, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});
	});

	describe("Argument Parsing and Validation", () => {
		it("should throw error when both first and last are provided", async () => {
			await expect(
				resolveActionItems(mockParent, { first: 10, last: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'Argument "last" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when before is provided with first", async () => {
			await expect(
				resolveActionItems(mockParent, { first: 10, before: "cursor" }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
								message:
									'Argument "before" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when after is provided with last", async () => {
			await expect(
				resolveActionItems(mockParent, { last: 10, after: "cursor" }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message:
									'Argument "after" cannot be provided with argument "last".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when neither first nor last is provided", async () => {
			await expect(resolveActionItems(mockParent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["first"],
								message:
									'A non-null value for argument "first" must be provided.',
							}),
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'A non-null value for argument "last" must be provided.',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for invalid after cursor format", async () => {
			await expect(
				resolveActionItems(
					mockParent,
					{ first: 10, after: "invalid-cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for invalid before cursor format", async () => {
			await expect(
				resolveActionItems(
					mockParent,
					{ last: 10, before: "invalid-cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor with invalid JSON", async () => {
			const invalidJsonCursor = Buffer.from("invalid json", "utf-8").toString(
				"base64url",
			);

			await expect(
				resolveActionItems(
					mockParent,
					{ first: 10, after: invalidJsonCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor missing required fields", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({ id: "test-id" }), // Missing assignedAt
				"utf-8",
			).toString("base64url");

			await expect(
				resolveActionItems(
					mockParent,
					{ first: 10, after: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor with invalid UUID", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					id: "invalid-uuid",
					assignedAt: new Date("2024-01-01T10:00:00Z"),
				}),
				"utf-8",
			).toString("base64url");

			await expect(
				resolveActionItems(
					mockParent,
					{ first: 10, after: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});
	});

	describe("Cursor Creation", () => {
		it("should create valid base64url cursors", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItems(mockParent, { first: 1 }, ctx);

			// Verify cursor format
			const cursor = result.edges[0]?.cursor;
			expect(cursor).toBeTruthy();

			if (cursor) {
				const decoded = JSON.parse(
					Buffer.from(cursor, "base64url").toString("utf-8"),
				);
				expect(decoded).toEqual({
					id: mockActionItem1.id,
					assignedAt: mockActionItem1.assignedAt.toISOString(),
				});
			}
		});
	});

	describe("Query Parameter Validation", () => {
		it("should reject first parameter below minimum", async () => {
			await expect(
				resolveActionItems(mockParent, { first: 0 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});

		it("should reject first parameter above maximum", async () => {
			await expect(
				resolveActionItems(mockParent, { first: 33 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});

		it("should reject last parameter below minimum", async () => {
			await expect(
				resolveActionItems(mockParent, { last: 0 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});

		it("should reject last parameter above maximum", async () => {
			await expect(
				resolveActionItems(mockParent, { last: 33 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});
	});

	describe("Error Propagation", () => {
		it("should propagate database errors", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				dbError,
			);

			await expect(
				resolveActionItems(mockParent, { first: 10 }, ctx),
			).rejects.toThrow(dbError);
		});
	});

	describe("Node and Edge Structure", () => {
		it("should return correct node structure", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItems(mockParent, { first: 1 }, ctx);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItem1);
			expect(result.edges[0]?.cursor).toBeTruthy();
		});

		it("should handle empty results correctly", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await resolveActionItems(mockParent, { first: 10 }, ctx);

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.startCursor).toBeNull();
			expect(result.pageInfo.endCursor).toBeNull();
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});
	});

	describe("Order By Verification", () => {
		it("should use ascending order for forward pagination", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItems(mockParent, { first: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([
				asc(actionsTable.assignedAt),
				asc(actionsTable.id),
			]);
		});

		it("should use descending order for backward pagination", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItems(mockParent, { last: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([
				desc(actionsTable.assignedAt),
				desc(actionsTable.id),
			]);
		});
	});

	describe("Category ID Filtering", () => {
		it("should always filter by parent category ID", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItems(mockParent, { first: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("where");
			expect(callArgs.where).toEqual(
				eq(actionsTable.categoryId, mockParent.id),
			);
		});
	});

	describe("Date Handling", () => {
		it("should handle Date serialization in cursors correctly", async () => {
			const testDate = new Date("2024-06-15T14:30:00.123Z");
			const itemWithPreciseDate = {
				...mockActionItem1,
				assignedAt: testDate,
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				itemWithPreciseDate,
			]);

			const result = await resolveActionItems(mockParent, { first: 1 }, ctx);

			const cursor = result.edges[0]?.cursor;
			if (cursor) {
				const decoded = JSON.parse(
					Buffer.from(cursor, "base64url").toString("utf-8"),
				);
				expect(decoded.assignedAt).toBe(testDate.toISOString());
			}
		});

		it("should handle items with same assignedAt correctly", async () => {
			const sameTimeItem1 = {
				...mockActionItem1,
				id: "01234567-89ab-cdef-0123-456789abcde4",
			};
			const sameTimeItem2 = {
				...mockActionItem1,
				id: "01234567-89ab-cdef-0123-456789abcde5",
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				sameTimeItem1,
				sameTimeItem2,
			]);

			const result = await resolveActionItems(mockParent, { first: 2 }, ctx);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node.id).toBe(
				"01234567-89ab-cdef-0123-456789abcde4",
			);
			expect(result.edges[1]?.node.id).toBe(
				"01234567-89ab-cdef-0123-456789abcde5",
			);
		});
	});

	describe("Null Handling", () => {
		it("should handle null cursor values", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			// Test with null after
			const result1 = await resolveActionItems(
				mockParent,
				{ first: 1, after: null },
				ctx,
			);
			expect(result1.edges).toHaveLength(1);

			// Test with null before
			const result2 = await resolveActionItems(
				mockParent,
				{ last: 1, before: null },
				ctx,
			);
			expect(result2.edges).toHaveLength(1);
		});

		it("should handle undefined cursor values", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			// Test with undefined after
			const result1 = await resolveActionItems(
				mockParent,
				{ first: 1, after: undefined },
				ctx,
			);
			expect(result1.edges).toHaveLength(1);

			// Test with undefined before
			const result2 = await resolveActionItems(
				mockParent,
				{ last: 1, before: undefined },
				ctx,
			);
			expect(result2.edges).toHaveLength(1);
		});
	});
});
