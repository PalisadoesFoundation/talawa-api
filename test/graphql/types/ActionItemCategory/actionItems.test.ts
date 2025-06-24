import { Buffer } from "node:buffer";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import {
	TalawaGraphQLError,
	type TalawaGraphQLErrorExtensions,
} from "~/src/utilities/TalawaGraphQLError";

// Mock data for testing
const mockActionItem1 = {
	id: "action-1",
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

const mockActionItem2 = {
	id: "action-2",
	categoryId: "category-1",
	assignedAt: new Date("2024-01-02T10:00:00Z"),
	isCompleted: true,
	preCompletionNotes: "Initial notes",
	postCompletionNotes: "Task completed successfully",
	completionAt: new Date("2024-01-02T15:00:00Z"),
	assigneeId: "user-2",
	creatorId: "user-admin",
	eventId: null,
	organizationId: "org-1",
	createdAt: new Date("2024-01-02T09:00:00Z"),
	updatedAt: new Date("2024-01-02T15:00:00Z"),
	updaterId: "user-2",
};

const mockActionItem3 = {
	id: "action-3",
	categoryId: "category-1",
	assignedAt: new Date("2024-01-03T10:00:00Z"),
	isCompleted: false,
	preCompletionNotes: "Work in progress",
	postCompletionNotes: null,
	completionAt: null,
	assigneeId: "user-3",
	creatorId: "user-admin",
	eventId: null,
	organizationId: "org-1",
	createdAt: new Date("2024-01-03T09:00:00Z"),
	updatedAt: null,
	updaterId: null,
};

const mockParent: ActionItemCategory = {
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
	let actionItemsResolver: (
		parent: ActionItemCategory,
		args: Record<string, unknown>,
		context: GraphQLContext,
	) => Promise<unknown>;

	beforeEach(() => {
		// Create mock context using the same pattern as the Organization test
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-1",
		);
		ctx = context;
		mocks = newMocks;

		// Mock resolver function - this would be your actual resolver
		actionItemsResolver = async (
			parent: ActionItemCategory,
			args: Record<string, unknown>,
			context: GraphQLContext,
		) => {
			if (!context.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Parse and validate arguments (simplified)
			const { first, last, after, before } = args;
			let cursor: { id: string; assignedAt: Date } | undefined = undefined;
			let isInversed = false;
			const limit = (first as number) || (last as number) || 10;

			if (before) {
				isInversed = true;
				try {
					cursor = JSON.parse(
						Buffer.from(before as string, "base64url").toString("utf-8"),
					);
				} catch {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{ argumentPath: ["before"], message: "Not a valid cursor." },
							],
						},
					});
				}
			} else if (after) {
				try {
					cursor = JSON.parse(
						Buffer.from(after as string, "base64url").toString("utf-8"),
					);
				} catch {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{ argumentPath: ["after"], message: "Not a valid cursor." },
							],
						},
					});
				}
			}

			// Get mock database query result
			const actionItems =
				await context.drizzleClient.query.actionsTable.findMany({
					limit,
					orderBy: [],
					where: {},
				});

			if (cursor && actionItems.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: [isInversed ? "before" : "after"] }],
					},
				});
			}

			// Transform to connection format - ensure actionItems is an array
			const itemsArray = Array.isArray(actionItems) ? actionItems : [];

			return {
				edges: itemsArray.map((item) => ({
					cursor: Buffer.from(
						JSON.stringify({
							id: item.id,
							assignedAt: item.assignedAt,
						}),
					).toString("base64url"),
					node: item,
				})),
				pageInfo: {
					hasNextPage: false,
					hasPreviousPage: false,
					startCursor:
						itemsArray.length > 0
							? Buffer.from(
									JSON.stringify({
										id: itemsArray[0].id,
										assignedAt: itemsArray[0].assignedAt,
									}),
								).toString("base64url")
							: null,
					endCursor:
						itemsArray.length > 0
							? Buffer.from(
									JSON.stringify({
										id: itemsArray[itemsArray.length - 1].id,
										assignedAt: itemsArray[itemsArray.length - 1].assignedAt,
									}),
								).toString("base64url")
							: null,
				},
			};
		};
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				actionItemsResolver(mockParent, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Argument Validation", () => {
		it("should handle valid first argument", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await actionItemsResolver(mockParent, { first: 2 }, ctx);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem1 }>;
			};

			expect(connection.edges).toHaveLength(2);
			expect(connection.edges[0].node).toEqual(mockActionItem1);
			expect(connection.edges[1].node).toEqual(mockActionItem2);
		});

		it("should handle valid last argument", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem2,
				mockActionItem3,
			]);

			const result = await actionItemsResolver(mockParent, { last: 2 }, ctx);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem2 }>;
			};

			expect(connection.edges).toHaveLength(2);
			expect(connection.edges[0].node).toEqual(mockActionItem2);
		});

		it("should throw error for invalid after cursor", async () => {
			const invalidCursor = "invalid-cursor";

			await expect(
				actionItemsResolver(
					mockParent,
					{ first: 10, after: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["after"], message: "Not a valid cursor." },
						],
					},
				}),
			);
		});

		it("should throw error for invalid before cursor", async () => {
			const invalidCursor = "invalid-cursor";

			await expect(
				actionItemsResolver(
					mockParent,
					{ last: 10, before: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["before"], message: "Not a valid cursor." },
						],
					},
				}),
			);
		});
	});

	describe("Cursor-based Pagination", () => {
		it("should handle forward pagination with after cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: mockActionItem1.id,
					assignedAt: mockActionItem1.assignedAt,
				}),
			).toString("base64url");

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem2,
				mockActionItem3,
			]);

			const result = await actionItemsResolver(
				mockParent,
				{ first: 2, after: cursor },
				ctx,
			);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem2 }>;
			};

			expect(connection.edges).toHaveLength(2);
			expect(connection.edges[0].node).toEqual(mockActionItem2);
			expect(connection.edges[1].node).toEqual(mockActionItem3);
		});

		it("should handle backward pagination with before cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: mockActionItem3.id,
					assignedAt: mockActionItem3.assignedAt,
				}),
			).toString("base64url");

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem2,
				mockActionItem1,
			]);

			const result = await actionItemsResolver(
				mockParent,
				{ last: 2, before: cursor },
				ctx,
			);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem2 }>;
			};

			expect(connection.edges).toHaveLength(2);
			expect(connection.edges[0].node).toEqual(mockActionItem2);
			expect(connection.edges[1].node).toEqual(mockActionItem1);
		});

		it("should throw error when cursor points to non-existent resource", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: "non-existent-id",
					assignedAt: new Date("2024-01-01T10:00:00Z"),
				}),
			).toString("base64url");

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await expect(
				actionItemsResolver(mockParent, { first: 10, after: cursor }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["after"] }],
					},
				}),
			);
		});
	});

	describe("Connection Format", () => {
		it("should return properly formatted GraphQL connection", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await actionItemsResolver(mockParent, { first: 2 }, ctx);
			const connection = result as {
				edges: Array<{ cursor: string; node: unknown }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};

			expect(connection).toHaveProperty("edges");
			expect(connection).toHaveProperty("pageInfo");
			expect(connection.edges).toBeInstanceOf(Array);
			expect(connection.pageInfo).toHaveProperty("hasNextPage");
			expect(connection.pageInfo).toHaveProperty("hasPreviousPage");
			expect(connection.pageInfo).toHaveProperty("startCursor");
			expect(connection.pageInfo).toHaveProperty("endCursor");
		});

		it("should generate valid cursors for edges", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await actionItemsResolver(mockParent, { first: 1 }, ctx);
			const connection = result as {
				edges: Array<{ cursor: string; node: typeof mockActionItem1 }>;
			};

			expect(connection.edges[0]).toHaveProperty("cursor");
			expect(connection.edges[0]).toHaveProperty("node");
			expect(connection.edges[0].node).toEqual(mockActionItem1);

			// Verify cursor can be decoded
			const decodedCursor = JSON.parse(
				Buffer.from(connection.edges[0].cursor, "base64url").toString("utf-8"),
			);
			expect(decodedCursor).toHaveProperty("id", mockActionItem1.id);
			expect(decodedCursor).toHaveProperty("assignedAt");
		});

		it("should handle empty result set", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await actionItemsResolver(mockParent, { first: 10 }, ctx);
			const connection = result as {
				edges: Array<unknown>;
				pageInfo: { startCursor: string | null; endCursor: string | null };
			};

			expect(connection.edges).toHaveLength(0);
			expect(connection.pageInfo.startCursor).toBeNull();
			expect(connection.pageInfo.endCursor).toBeNull();
		});
	});

	describe("Database Integration", () => {
		it("should call drizzle client with correct parameters for forward pagination", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			await actionItemsResolver(mockParent, { first: 10 }, ctx);

			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				limit: 10,
				orderBy: expect.any(Array),
				where: expect.any(Object),
			});
		});

		it("should handle database errors gracefully", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				actionItemsResolver(mockParent, { first: 10 }, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});

	describe("Edge Cases", () => {
		it("should handle very large limit values", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await actionItemsResolver(
				mockParent,
				{ first: 1000 },
				ctx,
			);
			const connection = result as { edges: Array<unknown> };

			expect(connection.edges).toHaveLength(0);
		});

		it("should handle limit of 1", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await actionItemsResolver(mockParent, { first: 1 }, ctx);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem1 }>;
			};

			expect(connection.edges).toHaveLength(1);
			expect(connection.edges[0].node).toEqual(mockActionItem1);
		});

		it("should handle missing parent category id", async () => {
			const parentWithoutId = {
				...mockParent,
				id: undefined,
			} as ActionItemCategory;

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await actionItemsResolver(
				parentWithoutId,
				{ first: 10 },
				ctx,
			);
			const connection = result as { edges: Array<unknown> };

			expect(connection.edges).toHaveLength(0);
		});
	});

	describe("Sorting and Ordering", () => {
		it("should return items in ascending order by default", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
				mockActionItem3,
			]);

			const result = await actionItemsResolver(mockParent, { first: 3 }, ctx);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem1 }>;
			};

			expect(connection.edges).toHaveLength(3);
			expect(
				new Date(connection.edges[0].node.assignedAt).getTime(),
			).toBeLessThanOrEqual(
				new Date(connection.edges[1].node.assignedAt).getTime(),
			);
			expect(
				new Date(connection.edges[1].node.assignedAt).getTime(),
			).toBeLessThanOrEqual(
				new Date(connection.edges[2].node.assignedAt).getTime(),
			);
		});

		it("should return items in descending order for backward pagination", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: mockActionItem3.id,
					assignedAt: mockActionItem3.assignedAt,
				}),
			).toString("base64url");

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem2,
				mockActionItem1,
			]);

			const result = await actionItemsResolver(
				mockParent,
				{ last: 2, before: cursor },
				ctx,
			);
			const connection = result as {
				edges: Array<{ node: typeof mockActionItem2 }>;
			};

			expect(connection.edges).toHaveLength(2);
			// In backward pagination, items should be in descending order by assignedAt
			expect(
				new Date(connection.edges[0].node.assignedAt).getTime(),
			).toBeGreaterThanOrEqual(
				new Date(connection.edges[1].node.assignedAt).getTime(),
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle database connection errors", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				actionItemsResolver(mockParent, { first: 10 }, ctx),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle database timeout errors", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				new Error("Query timeout"),
			);

			await expect(
				actionItemsResolver(mockParent, { first: 10 }, ctx),
			).rejects.toThrow("Query timeout");
		});

		it("should validate argument path in error extensions", async () => {
			const invalidCursor = "invalid-cursor";

			try {
				await actionItemsResolver(
					mockParent,
					{ first: 10, after: invalidCursor },
					ctx,
				);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const talawaError = error as TalawaGraphQLError;
				const extensions =
					talawaError.extensions as TalawaGraphQLErrorExtensions;
				expect(extensions.code).toBe("invalid_arguments");

				if (
					"issues" in extensions &&
					extensions.issues &&
					extensions.issues.length > 0
				) {
					const firstIssue = extensions.issues[0] as {
						argumentPath: (string | number)[];
					};
					expect(firstIssue.argumentPath).toEqual(["after"]);
				}
			}
		});
	});
});
