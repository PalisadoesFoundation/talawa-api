import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/PostAttachment/PostAttachment";
import "~/src/graphql/types/Post/Post";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/creator";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { schema } from "~/src/graphql/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Get the creator resolver from the schema
const postType = schema.getType("Post") as GraphQLObjectType;
const creatorField = postType.getFields().creator;
if (!creatorField?.resolve) {
	throw new Error("Creator field or resolver not found in schema");
}
const resolveCreator = creatorField.resolve as GraphQLFieldResolver<
	PostType,
	GraphQLContext
>;

describe("Post Resolver - Creator Field", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
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

	it("should return the creator user if they exist", async () => {
		const mockUser = {
			id: "user-123",
			name: "Test User",
			emailAddress: "test@example.com",
		};

		// Mock the DataLoader's load function
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(mockUser);

		const result = await resolveCreator(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toEqual(mockUser);
		expect(ctx.dataloaders.user.load).toHaveBeenCalledWith(mockPost.creatorId);
	});

	it("should throw unexpected error if creator user does not exist", async () => {
		// DataLoader returns null for non-existent users
		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(null);

		try {
			await resolveCreator(mockPost, {}, ctx, {} as GraphQLResolveInfo);
			throw new Error("Expected resolver to throw");
		} catch (err) {
			expect(err).toBeInstanceOf(TalawaGraphQLError);
			expect(err).toMatchObject({ extensions: { code: "unexpected" } });
		}
	});
	it("should return null when creatorId is null", async () => {
		mockPost.creatorId = null as unknown as string;

		// Mock the DataLoader to verify it's not called
		ctx.dataloaders.user.load = vi.fn();

		const result = await resolveCreator(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBeNull();
		expect(ctx.dataloaders.user.load).not.toHaveBeenCalled();
	});
});
