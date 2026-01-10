import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { resolveUpdater } from "~/src/graphql/types/Post/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Post Resolver - Updater Field", () => {
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
			creatorId: "user-123",
			body: "Test Body",
			title: "Test Title",
			updaterId: "user-123",
			organizationId: "org-123",
			updatedAt: new Date(),
			pinnedAt: new Date(),
			attachments: [],
		} as PostType;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, unauthenticatedCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should allow access if user is system administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should allow access if user is organization administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should throw unauthorized error if user is not an administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if post has no updater", async () => {
		mockPost.updaterId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if they are the updater", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return updater if different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const updaterUser = {
			id: "updater-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockPost.updaterId = "updater-456";
		// First findFirst for currentUser permission check
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			currentUser,
		);
		// DataLoader is used to fetch the updater user
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(updaterUser);
		expect(ctx.dataloaders.user.load).toHaveBeenCalledWith("updater-456");
	});

	it("should handle empty organization memberships array", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mockPost.updaterId = "updater-456";
		// First findFirst for currentUser permission check
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			currentUser,
		);
		// DataLoader returns null for non-existent users
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: mockPost.organizationId },
			],
		};

		// Mock implementation to verify if organizationId filter is used
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = { organizationId: "org-123" };
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockPost.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUser);
		});

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});
});
