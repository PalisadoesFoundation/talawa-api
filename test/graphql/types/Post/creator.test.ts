import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreator } from "~/src/graphql/types/Post/creator";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Post Resolver - Creator Field", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockPost = {
			id: "post-123",
			caption: "Test Caption",
			createdAt: new Date(),
			creatorId: "user-456",
			body: "Test Body",
			title: "Test Title",
			updaterId: "user-123",
			organizationId: "org-123",
			updatedAt: new Date(),
			pinnedAt: new Date(),
			attachments: [],
		} as PostType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.currentClient.isAuthenticated = true;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
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

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
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

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
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

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockPost, {}, ctx);
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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockPost, {}, ctx);
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
			mockPost.creatorId = null;

			const result = await resolveCreator(mockPost, {}, ctx);
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
			mockPost.creatorId = "user-123";

			const result = await resolveCreator(mockPost, {}, ctx);
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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockPost, {}, ctx);
			expect(result).toEqual(creatorUser);
		});

		it("should throw unexpected error if creator user does not exist", async () => {
			const currentUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockPost.creatorId = "user-456";

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a post's creator id that isn't null.",
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
			mockPost.creatorId = "user-123";

			await resolveCreator(mockPost, {}, ctx);

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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			await resolveCreator(mockPost, {}, ctx);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);

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

			const creatorUser = {
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
			newCtx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockPost, {}, newCtx);
			expect(result).toEqual(creatorUser);
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

			mockPost.creatorId = "";

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(resolveCreator(mockPost, {}, ctx)).rejects.toThrow(dbError);
		});

		it("should handle null organization memberships with global admin", async () => {
			const globalAdminUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: null,
			};

			const creatorUser = {
				id: "user-456",
				role: "member",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				globalAdminUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(creatorUser);

			const result = await resolveCreator(mockPost, {}, ctx);
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

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

			mockPost.creatorId = "non-existent-user";

			const promise = resolveCreator(mockPost, {}, ctx);

			await expect(promise).rejects.toBeInstanceOf(TalawaGraphQLError);
			await expect(promise).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});
			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a post's creator id that isn't null.",
			);
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

			await resolveCreator(mockPost, {}, ctx);

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

			const result = await resolveCreator(mockPost, {}, ctx);

			expect(result).toEqual(creatorUser);
			expect(result).toHaveProperty("id", "user-456");
			expect(result).toHaveProperty("name", "Jane Doe");
			expect(result).toHaveProperty("role", "member");
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
			mockPost.creatorId = "user-123";

			const result = await resolveCreator(mockPost, {}, ctx);

			expect(result).toBe(currentUser);
			expect(result).toHaveProperty("name", "Current User");
		});
	});
});
