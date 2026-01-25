import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItem as ActionItemType } from "~/src/graphql/types/ActionItem/ActionItem";
import { resolveUpdater } from "~/src/graphql/types/ActionItem/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItem Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockActionItem: ActionItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItem = {
			id: "01234567-89ab-4def-a123-456789abcdef",
			organizationId: "org-123",
			updaterId: "user-456",
			assignedAt: new Date("2024-01-01T10:00:00Z"),
			isCompleted: false,
			completionAt: null,
			preCompletionNotes: null,
			postCompletionNotes: null,
			creatorId: "user-admin",
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

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.currentClient.isAuthenticated = true;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
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

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockActionItem, {}, ctx);
			expect(result).toEqual(updaterUser);
		});

		it("should allow organization administrator access", async () => {
			const currentUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockActionItem, {}, ctx);
			expect(result).toEqual(updaterUser);
		});
	});

	describe("Updater Logic", () => {
		beforeEach(() => {
			// Setup authorized user for these tests
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
		});

		it("should return null if updaterId is null", async () => {
			mockActionItem.updaterId = null;

			const result = await resolveUpdater(mockActionItem, {}, ctx);
			expect(result).toBeNull();
		});

		it("should return current user if updaterId matches current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			mockActionItem.updaterId = "user-123";

			const result = await resolveUpdater(mockActionItem, {}, ctx);
			expect(result).toEqual(currentUser);
		});

		it("should return updater user when updaterId is different from current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
				name: "Updater User",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockActionItem, {}, ctx);
			expect(result).toEqual(updaterUser);
		});

		it("should throw unexpected error if updater user does not exist", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.updaterId = "user-456";

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item's updater id that isn't null.",
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
			mockActionItem.updaterId = "user-123";

			await resolveUpdater(mockActionItem, {}, ctx);

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

		it("should query updater user with correct parameters when different from current user", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			await resolveUpdater(mockActionItem, {}, ctx);

			// Verify first query was made for current user
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);

			// DataLoader should be called for updater user
			expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("user-456");
		});
	});

	describe("Edge Cases", () => {
		it("should handle mixed authorization scenarios", async () => {
			const orgAdminUser = {
				id: "user-789",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			const { context: newCtx, mocks: newMocks } = createMockGraphQLContext(
				true,
				"user-789",
			);

			newMocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				orgAdminUser,
			);
			newCtx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockActionItem, {}, newCtx);
			expect(result).toEqual(updaterUser);
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

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should handle updaterId as empty string", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.updaterId = ""; // Empty string instead of null

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(resolveUpdater(mockActionItem, {}, ctx)).rejects.toThrow(
				dbError,
			);
		});
	});

	describe("Logging", () => {
		it("should log error when updater user is not found", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockActionItem.updaterId = "non-existent-user";

			try {
				await resolveUpdater(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an action item's updater id that isn't null.",
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

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			await resolveUpdater(mockActionItem, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});
	});

	describe("Return Values", () => {
		it("should return user object with all expected properties", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
				name: "John Doe",
				avatarMimeType: "image/jpeg",
				description: "Test user",
				createdAt: new Date("2024-01-01"),
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockActionItem, {}, ctx);

			expect(result).toEqual(updaterUser);
			expect(result).toHaveProperty("id", "user-456");
			expect(result).toHaveProperty("name", "John Doe");
			expect(result).toHaveProperty("role", "member");
		});

		it("should preserve all user properties from database", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const complexUpdaterUser = {
				id: "user-456",
				role: "member",
				name: "Complex User",
				avatarMimeType: "image/png",
				description: "A user with many properties",
				createdAt: new Date("2024-01-01"),
				customField: "custom value", // Additional field
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(complexUpdaterUser);

			const result = await resolveUpdater(mockActionItem, {}, ctx);

			expect(result).toEqual(complexUpdaterUser);
			expect(result).toHaveProperty("customField", "custom value");
		});
	});
});
