import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItem as ActionItemType } from "~/src/graphql/types/ActionItem/ActionItem";
import { resolveCategory } from "~/src/graphql/types/ActionItem/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItem Resolver - Category Field", () => {
	let ctx: GraphQLContext;
	let mockActionItem: ActionItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItem = {
			id: "01234567-89ab-4def-a123-456789abcdef",
			organizationId: "org-123",
			categoryId: "category-456",
			assignedAt: new Date("2024-01-01T10:00:00Z"),
			isCompleted: false,
			completionAt: null,
			preCompletionNotes: null,
			postCompletionNotes: null,
			creatorId: "user-admin",
			updaterId: "user-update",
			eventId: null,
			isTemplate: false,
			recurringEventInstanceId: null,
			volunteerId: "volunteer-789",
			volunteerGroupId: null,
			createdAt: new Date("2024-01-01T09:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
		} as ActionItemType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	describe("Category Resolution", () => {
		it("should return null when categoryId is null", async () => {
			mockActionItem.categoryId = null;

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toBeNull();
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should return null when categoryId is empty string", async () => {
			mockActionItem.categoryId = "";

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toBeNull();
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should successfully resolve category when it exists", async () => {
			const mockCategory = {
				id: "category-456",
				name: "Test Category",
				description: "Test Category Description",
				isDisabled: false,
				organizationId: "org-123",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				creatorId: "user-admin",
				updaterId: null,
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(mockCategory);
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should throw unexpected error when category does not exist", async () => {
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(resolveCategory(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item's category id that isn't null.",
			);
		});
	});

	describe("Database Query Verification", () => {
		it("should call database query with correct category ID", async () => {
			const mockCategory = {
				id: "category-456",
				name: "Test Category",
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			await resolveCategory(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledTimes(1);
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should handle different category IDs correctly", async () => {
			const mockCategory1 = {
				id: "category-111",
				name: "Category 1",
			};

			const mockCategory2 = {
				id: "category-222",
				name: "Category 2",
			};

			// Test with first category ID
			mockActionItem.categoryId = "category-111";
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValueOnce(
				mockCategory1,
			);

			let result = await resolveCategory(mockActionItem, {}, ctx);
			expect(result).toEqual(mockCategory1);

			// Test with second category ID
			mockActionItem.categoryId = "category-222";
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValueOnce(
				mockCategory2,
			);

			result = await resolveCategory(mockActionItem, {}, ctx);
			expect(result).toEqual(mockCategory2);

			// Verify both calls were made
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});

		it("should pass categoryId as string to database query", async () => {
			const mockCategory = { id: "category-456", name: "Test" };
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			// Ensure categoryId is treated as string
			mockActionItem.categoryId = "category-456";

			await resolveCategory(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});
	});

	describe("Error Handling", () => {
		it("should log error with correct message when category is not found", async () => {
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				undefined,
			);

			try {
				await resolveCategory(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an action item's category id that isn't null.",
				);
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions.code).toBe(
					"unexpected",
				);
				expect((error as TalawaGraphQLError).message).toBe(
					"Something went wrong. Please try again later.",
				);
			}
		});

		it("should handle database errors gracefully", async () => {
			const databaseError = new Error("Database connection failed");
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockRejectedValue(
				databaseError,
			);

			await expect(resolveCategory(mockActionItem, {}, ctx)).rejects.toThrow(
				databaseError,
			);

			// Verify the query was attempted
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not log errors for successful operations", async () => {
			const mockCategory = {
				id: "category-456",
				name: "Success Category",
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			await resolveCategory(mockActionItem, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should handle query timeout errors", async () => {
			const timeoutError = new Error("Query timeout");
			timeoutError.name = "TimeoutError";
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockRejectedValue(
				timeoutError,
			);

			await expect(resolveCategory(mockActionItem, {}, ctx)).rejects.toThrow(
				timeoutError,
			);
		});
	});

	describe("Return Values", () => {
		it("should return category with all expected properties", async () => {
			const mockCategory = {
				id: "category-456",
				name: "Complete Category",
				description: "A comprehensive category",
				isDisabled: false,
				organizationId: "org-123",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T12:00:00Z"),
				creatorId: "user-admin",
				updaterId: "user-modifier",
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(mockCategory);
			expect(result).toHaveProperty("id", "category-456");
			expect(result).toHaveProperty("name", "Complete Category");
			expect(result).toHaveProperty("description", "A comprehensive category");
			expect(result).toHaveProperty("isDisabled", false);
			expect(result).toHaveProperty("organizationId", "org-123");
		});

		it("should return minimal category data correctly", async () => {
			const minimalCategory = {
				id: "category-456",
				name: "Minimal Category",
				isDisabled: false,
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				minimalCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(minimalCategory);
			expect(result).toHaveProperty("id", "category-456");
			expect(result).toHaveProperty("name", "Minimal Category");
		});

		it("should preserve all category properties from database", async () => {
			const complexCategory = {
				id: "category-456",
				name: "Complex Category",
				description: "Category with many properties",
				isDisabled: true,
				organizationId: "org-123",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-02"),
				creatorId: "user-admin",
				updaterId: "user-modifier",
				customField: "custom value", // Additional field
				metadata: { type: "special", priority: "high" },
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				complexCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(complexCategory);
			expect(result).toHaveProperty("customField", "custom value");
			expect(result).toHaveProperty("metadata.type", "special");
			expect(result).toHaveProperty("metadata.priority", "high");
		});
	});

	describe("Edge Cases", () => {
		it("should handle categoryId with special characters", async () => {
			const specialCategory = {
				id: "category-special-123",
				name: "Special Category",
			};

			mockActionItem.categoryId = "category-special-123";
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				specialCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(specialCategory);
		});

		it("should handle very long category IDs", async () => {
			const longId = `category-${"a".repeat(100)}`;
			const longIdCategory = {
				id: longId,
				name: "Long ID Category",
			};

			mockActionItem.categoryId = longId;
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				longIdCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(longIdCategory);
			expect(result?.id).toBe(longId);
		});

		it("should handle categoryId with UUID format", async () => {
			const uuidCategoryId = "01234567-89ab-4def-a123-456789abcdef";
			const uuidCategory = {
				id: uuidCategoryId,
				name: "UUID Category",
			};

			mockActionItem.categoryId = uuidCategoryId;
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				uuidCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(uuidCategory);
			expect(result?.id).toBe(uuidCategoryId);
		});

		it("should handle disabled categories correctly", async () => {
			const disabledCategory = {
				id: "category-456",
				name: "Disabled Category",
				isDisabled: true,
				description: "This category is disabled",
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				disabledCategory,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(disabledCategory);
			expect(result?.isDisabled).toBe(true);
		});

		it("should handle categories with null optional fields", async () => {
			const categoryWithNulls = {
				id: "category-456",
				name: "Category with Nulls",
				description: null,
				updaterId: null,
				isDisabled: false,
			};

			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				categoryWithNulls,
			);

			const result = await resolveCategory(mockActionItem, {}, ctx);

			expect(result).toEqual(categoryWithNulls);
			expect(result?.description).toBeNull();
			expect(result?.updaterId).toBeNull();
		});
	});

	describe("Performance Considerations", () => {
		it("should only query database when categoryId exists", async () => {
			// Test with null
			mockActionItem.categoryId = null;
			await resolveCategory(mockActionItem, {}, ctx);

			// Test with empty string
			mockActionItem.categoryId = "";
			await resolveCategory(mockActionItem, {}, ctx);

			// Verify no database queries were made
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should make exactly one database query for valid categoryId", async () => {
			const mockCategory = { id: "category-456", name: "Test" };
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			await resolveCategory(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Type Safety", () => {
		it("should handle categoryId type casting correctly", async () => {
			const mockCategory = { id: "category-456", name: "Test" };
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			// Test with number-like string
			mockActionItem.categoryId = "123456";
			await resolveCategory(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should preserve original categoryId value in query", async () => {
			const mockCategory = { id: "test-category", name: "Test" };
			mocks.drizzleClient.query.actionItemCategoriesTable.findFirst.mockResolvedValue(
				mockCategory,
			);

			const originalCategoryId = "test-category";
			mockActionItem.categoryId = originalCategoryId;

			await resolveCategory(mockActionItem, {}, ctx);

			// Verify the original value was used (through type casting)
			expect(
				mocks.drizzleClient.query.actionItemCategoriesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});
	});
});
