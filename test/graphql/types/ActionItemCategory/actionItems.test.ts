import { eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionsTable } from "~/src/drizzle/tables/actions";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveActionItems } from "~/src/graphql/types/ActionItemCategory/actionItems";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock data
const mockActionItem1 = {
	id: "01234567-89ab-cdef-0123-456789abcdef",
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
	id: "01234567-89ab-cdef-0123-456789abcde2",
	categoryId: "category-1",
	assignedAt: new Date("2024-01-02T10:00:00Z"),
	isCompleted: true,
	preCompletionNotes: "Pre completion notes",
	postCompletionNotes: "Post completion notes",
	completionAt: new Date("2024-01-02T15:00:00Z"),
	assigneeId: "user-2",
	creatorId: "user-admin",
	eventId: "event-1",
	organizationId: "org-1",
	createdAt: new Date("2024-01-02T09:00:00Z"),
	updatedAt: new Date("2024-01-02T14:00:00Z"),
	updaterId: "user-admin",
};

const mockActionItem3 = {
	id: "01234567-89ab-cdef-0123-456789abcde3",
	categoryId: "category-2", // Different category
	assignedAt: new Date("2024-01-03T10:00:00Z"),
	isCompleted: false,
	preCompletionNotes: null,
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
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveActionItems(mockParent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});
	});

	describe("Successful Resolution", () => {
		it("should return all action items for the category", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result).toEqual([mockActionItem1, mockActionItem2]);
			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, mockParent.id),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});

		it("should return empty array when no action items exist", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, mockParent.id),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});

		it("should return only action items for the specific category", async () => {
			// Mock returns items from different categories
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result).toEqual([mockActionItem1, mockActionItem2]);

			// Verify that the query filters by the correct category ID
			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, "category-1"),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});
	});

	describe("Query Parameters", () => {
		it("should use correct WHERE clause to filter by category ID", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItems(mockParent, {}, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, mockParent.id),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});

		it("should use correct ORDER BY clause", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItems(mockParent, {}, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, mockParent.id),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});
	});

	describe("Error Handling", () => {
		it("should propagate database errors", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				dbError,
			);

			await expect(resolveActionItems(mockParent, {}, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle database timeout errors", async () => {
			const timeoutError = new Error("Query timeout");
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				timeoutError,
			);

			await expect(resolveActionItems(mockParent, {}, ctx)).rejects.toThrow(
				timeoutError,
			);
		});
	});

	describe("Data Integrity", () => {
		it("should return action items with all expected properties", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					categoryId: expect.any(String),
					assignedAt: expect.any(Date),
					isCompleted: expect.any(Boolean),
					assigneeId: expect.any(String),
					creatorId: expect.any(String),
					organizationId: expect.any(String),
					createdAt: expect.any(Date),
				}),
			);
		});

		it("should handle null values correctly", async () => {
			const actionItemWithNulls = {
				...mockActionItem1,
				preCompletionNotes: null,
				postCompletionNotes: null,
				completionAt: null,
				eventId: null,
				updatedAt: null,
				updaterId: null,
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				actionItemWithNulls,
			]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result[0]).toEqual(actionItemWithNulls);
		});
	});

	describe("Different Categories", () => {
		it("should work with different category IDs", async () => {
			const differentCategoryParent: ActionItemCategoryType = {
				...mockParent,
				id: "category-2",
				name: "Different Category",
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem3,
			]);

			const result = await resolveActionItems(differentCategoryParent, {}, ctx);

			expect(result).toEqual([mockActionItem3]);
			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, "category-2"),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});
	});

	describe("Ordering", () => {
		it("should return items ordered by assignedAt and then by id", async () => {
			const item1 = {
				...mockActionItem1,
				assignedAt: new Date("2024-01-01T10:00:00Z"),
			};
			const item2 = {
				...mockActionItem2,
				assignedAt: new Date("2024-01-01T10:00:00Z"),
			}; // Same time
			const item3 = {
				...mockActionItem1,
				id: "different-id",
				assignedAt: new Date("2024-01-02T10:00:00Z"),
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				item1,
				item2,
				item3,
			]);

			const result = await resolveActionItems(mockParent, {}, ctx);

			expect(result).toHaveLength(3);
			// The actual ordering is handled by the database, we just verify the orderBy parameter
			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(actionsTable.categoryId, mockParent.id),
				orderBy: [actionsTable.assignedAt, actionsTable.id],
			});
		});
	});

	describe("Performance", () => {
		it("should only make one database call", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			await resolveActionItems(mockParent, {}, ctx);

			expect(
				mocks.drizzleClient.query.actionsTable.findMany,
			).toHaveBeenCalledTimes(1);
		});
	});
});
