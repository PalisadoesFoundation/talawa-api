import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { resolveUpdater } from "~/src/graphql/types/TagFolder/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TagFolder Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockTagFolder: TagFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockTagFolder = {
			id: "folder-123",
			name: "Test Folder",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: "user-456",
			organizationId: "org-123",
			parentFolderId: null,
		} as TagFolderType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.currentClient.isAuthenticated = true;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
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

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
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

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
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

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
			expect(result).toEqual(updaterUser);
		});
	});

	describe("Updater Logic", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
		});

		it("should return null if updaterId is null", async () => {
			mockTagFolder.updaterId = null;

			ctx.dataloaders.user.load = vi.fn();

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
			expect(result).toBeNull();
			expect(ctx.dataloaders.user.load).not.toHaveBeenCalled();
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
			mockTagFolder.updaterId = "user-123";

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
			expect(result).toEqual(currentUser);
		});

		it("should fetch and return updater if updaterId exists", async () => {
			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
			expect(result).toEqual(updaterUser);
			expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("user-456");
		});

		it("should throw unexpected error if updater user does not exist", async () => {
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a tag folder's updater id that isn't null.",
			);
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

			const result = await resolveUpdater(mockTagFolder, {}, newCtx);
			expect(result).toEqual(updaterUser);
		});

		it("should handle null organization memberships with global admin", async () => {
			const globalAdminUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: null,
			};

			const updaterUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				globalAdminUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

			const result = await resolveUpdater(mockTagFolder, {}, ctx);
			expect(result).toEqual(updaterUser);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(resolveUpdater(mockTagFolder, {}, ctx)).rejects.toThrow(
				dbError,
			);
		});
	});
});
