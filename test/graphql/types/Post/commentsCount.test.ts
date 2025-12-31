import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/commentsCount";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { schema } from "~/src/graphql/schema";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";

// Get the commentsCount resolver from the schema
const postType = schema.getType("Post") as GraphQLObjectType;
const commentsCountField = postType.getFields().commentsCount;
if (!commentsCountField?.resolve) {
	throw new Error("commentsCount field or resolver not found in schema");
}
const resolveCommentsCount = commentsCountField.resolve as GraphQLFieldResolver<
	PostType,
	GraphQLContext
>;

describe("Post Resolver - commentsCount", () => {
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

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return 0 when the count result is undefined", async () => {
		const mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([]),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

		const result = await resolveCommentsCount(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(0);
	});

	it("should return the correct count of comments for a post", async () => {
		const mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([{ count: 5 }]),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

		const result = await resolveCommentsCount(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(5);
		expect(mocks.drizzleClient.select).toHaveBeenCalled();
		expect(mockSelectChain.from).toHaveBeenCalled();
		expect(mockSelectChain.where).toHaveBeenCalled();
	});
});
