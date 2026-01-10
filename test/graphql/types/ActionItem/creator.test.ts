import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItem as ActionItemType } from "~/src/graphql/types/ActionItem/ActionItem";
import { resolveCreator } from "~/src/graphql/types/ActionItem/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItem Resolver - Creator Field", () => {
	let ctx: GraphQLContext;
	let mockActionItem: ActionItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItem = {
			id: "01234567-89ab-cdef-0123-456789abcdef",
			organizationId: "org-123",
			creatorId: "user-456",
			assignedAt: new Date("2024-01-01T10:00:00Z"),
			isCompleted: false,
			completionAt: null,
			preCompletionNotes: null,
			postCompletionNotes: null,
			updaterId: "user-update",
			eventId: null,
			categoryId: "category-123",
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

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.currentClient.isAuthenticated = true;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Authorization", () => {
		it("should throw unauthorized_action error if user is not an administrator and not an org admin", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			});

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should throw unauthorized_action error if user has no organization membership", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			});

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should throw unauthorized_action error when organization membership is undefined", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: undefined,
			});

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should allow global administrator access", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "member" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			// First findFirst for currentUser permission check
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			// DataLoader is used to fetch the creator user
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should allow organization administrator access", async () => {
			const currentUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			// First findFirst for currentUser permission check
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			// DataLoader is used to fetch the creator user
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(creatorUser);
		});
	});

	describe("Creator Logic", () => {
		beforeEach(() => {
			// Setup authorized user for these tests
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
		});

		it("should return null if creatorId is null", async () => {
			mockActionItem.creatorId = null;

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toBeNull();
		});

		it("should return current user if creatorId matches current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			mockActionItem.creatorId = "user-123";

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(currentUser);
		});

		it("should return creator user when creatorId is different from current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
				name: "Creator User",
			};

			// First findFirst for currentUser permission check
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			// DataLoader is used to fetch the creator user
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should throw unexpected error if creator user does not exist", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			// First findFirst for currentUser permission check
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			// DataLoader returns null for non-existent users
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.creatorId = "user-456";

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
			);
		});
	});

	describe("Database Query Verification", () => {
		it("should query current user with correct organization ID filter", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			mockActionItem.creatorId = "user-123";

			await resolveCreator(mockActionItem, {}, ctx);

			// Verify that the query was called with the correct parameters
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});
		});

		it("should query creator user with correct parameters when different from current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			// First findFirst for currentUser permission check
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			// DataLoader is used to fetch the creator user
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			await resolveCreator(mockActionItem, {}, ctx);

			// Verify first query was made for current user
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);

			// First call should be for current user with organization membership
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenNthCalledWith(1, {
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});

			// DataLoader should be called for creator user
			expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("user-456");
		});
	});

	describe("Edge Cases", () => {
		it("should handle mixed authorization scenarios", async () => {
			// Test org admin with non-admin global role
			const orgAdminUser = {
				id: "user-789",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			// Create new context with different authenticated user
			const { context: newCtx, mocks: newMocks } = createMockGraphQLContext(
				true,
				"user-789",
			);

			newMocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				orgAdminUser,
			);
			newCtx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, newCtx);
			expect(result).toEqual(creatorUser);
		});

		it("should handle empty organization memberships array", async () => {
			const currentUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should handle creatorId as empty string", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.creatorId = ""; // Empty string instead of null

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle null organization memberships with global admin", async () => {
			const globalAdminUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: null, // null instead of undefined
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				globalAdminUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(creatorUser);
		});
	});

	describe("Logging", () => {
		it("should log error when creator user is not found", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.creatorId = "non-existent-user";

			try {
				await resolveCreator(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
				);
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions.code).toBe(
					"unexpected",
				);
			}
		});

		it("should not log any errors for successful operations", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			await resolveCreator(mockActionItem, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should log correct error message format", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.creatorId = "missing-creator";

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow();

			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.stringContaining("action item's creator id"),
			);
			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.stringContaining("empty array"),
			);
		});
	});

	describe("Return Values", () => {
		it("should return user object with all expected properties", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
				name: "Jane Doe",
				avatarMimeType: "image/png",
				description: "Creator user",
				createdAt: new Date("2024-01-01"),
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);

			expect(result).toEqual(creatorUser);
			expect(result).toHaveProperty("id", "user-456");
			expect(result).toHaveProperty("name", "Jane Doe");
			expect(result).toHaveProperty("role", "member");
		});

		it("should preserve all user properties from database", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const complexCreatorUser = {
				id: "user-456",
				role: "member",
				name: "Complex Creator",
				avatarMimeType: "image/gif",
				description: "A creator with many properties",
				createdAt: new Date("2024-01-01"),
				customField: "custom creator value", // Additional field
				metadata: { type: "creator", active: true },
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(complexCreatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);

			expect(result).toEqual(complexCreatorUser);
			expect(result).toHaveProperty("customField", "custom creator value");
			expect(result).toHaveProperty("metadata.type", "creator");
			expect(result).toHaveProperty("metadata.active", true);
		});

		it("should return exact same object reference for current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
				name: "Current User",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			mockActionItem.creatorId = "user-123";

			const result = await resolveCreator(mockActionItem, {}, ctx);

			expect(result).toBe(currentUser); // Same reference
			expect(result).toHaveProperty("name", "Current User");
		});
	});

	describe("Permission Edge Cases", () => {
		it("should allow user who is both global admin and org admin", async () => {
			const superAdminUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				superAdminUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockActionItem, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should reject user who is neither global admin nor org admin", async () => {
			const regularUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				regularUser,
			);

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should handle organization membership with null role", async () => {
			const userWithNullRole = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: null }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				userWithNullRole,
			);

			await expect(resolveCreator(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});
	});
});
