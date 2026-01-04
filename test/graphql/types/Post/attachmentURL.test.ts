import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/PostAttachment/PostAttachment";
import "~/src/graphql/types/Post/Post";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/attachmentURL";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { schema } from "~/src/graphql/schema";

// Get the attachmentURL resolver from the schema
const postType = schema.getType("Post") as GraphQLObjectType;
const attachmentURLField = postType.getFields().attachmentURL;
if (!attachmentURLField?.resolve) {
	throw new Error("attachmentURL field or resolver not found in schema");
}
const resolveAttachmentURL = attachmentURLField.resolve as GraphQLFieldResolver<
	PostType,
	GraphQLContext
>;

describe("Post Resolver - attachmentURL Field", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
		ctx.envConfig.API_BASE_URL = "https://api.example.com";

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

	it("should return null when no attachments exist", async () => {
		mockPost.attachments = [];

		const result = await resolveAttachmentURL(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBeNull();
	});

	it("should return escaped URL when valid attachment exists", async () => {
		mockPost.attachments = [
			{
				id: "attachment-123",
				name: "test-image.jpg",
				objectName: "uploads/test-image-123.jpg",
				mimeType: "image/jpeg",
				fileHash: "abc123hash",
				postId: "post-123",
				creatorId: "user-123",
				updaterId: "user-123",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const result = await resolveAttachmentURL(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(
			"https://api.example.com/objects/uploads%2Ftest-image-123.jpg",
		);
	});
});
