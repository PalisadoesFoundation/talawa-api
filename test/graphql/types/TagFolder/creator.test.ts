import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { tagFolderCreatorResolver } from "~/src/graphql/types/TagFolder/creator";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("TagFolder creator Resolver Tests", () => {
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
			id: "folder-1",
			creatorId: "creator-123",
			organizationId: "org-1",
			updaterId: "user-123",
		} as TagFolderType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.currentClient.isAuthenticated = true;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(
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

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(
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

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(
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

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(
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
				id: "creator-123",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should allow organization administrator access", async () => {
			const currentUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			const creatorUser = {
				id: "creator-123",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
			expect(result).toEqual(creatorUser);
		});
	});

	describe("Creator Logic", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
		});

		it("should return null if creatorId is null", async () => {
			mockTagFolder.creatorId = null;

			ctx.dataloaders.user.load = vi.fn();

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
			expect(result).toBeNull();
			expect(ctx.dataloaders.user.load).not.toHaveBeenCalled();
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
			mockTagFolder.creatorId = "user-123";

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
			expect(result).toEqual(currentUser);
		});

		it("should return the creator user if they exist", async () => {
			const mockUser = { id: "creator-123", username: "creator" };

			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(mockUser);

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);

			expect(result).toEqual(mockUser);
			expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("creator-123");
		});

		it("should log error and throw unexpected if creatorId is set but user not found", async () => {
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});
			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Postgres select operation returned an empty array for a tag folder's creator id that isn't null.",
				),
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

			const creatorUser = {
				id: "creator-123",
				role: "member",
			};

			const { context: newCtx, mocks: newMocks } = createMockGraphQLContext(
				true,
				"user-789",
			);

			newMocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				orgAdminUser,
			);
			newCtx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, newCtx);
			expect(result).toEqual(creatorUser);
		});

		it("should handle null organization memberships with global admin", async () => {
			const globalAdminUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: null,
			};

			const creatorUser = {
				id: "creator-123",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				globalAdminUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await tagFolderCreatorResolver(mockTagFolder, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(
				tagFolderCreatorResolver(mockTagFolder, {}, ctx),
			).rejects.toThrow(dbError);
		});
	});
});
