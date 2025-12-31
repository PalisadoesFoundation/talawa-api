import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/commentsCount";
import { and, count, eq } from "drizzle-orm";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { commentsTable } from "~/src/drizzle/schema";
import { schema } from "~/src/graphql/schema";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";

// Mock dependencies
vi.mock("drizzle-orm", async () => {
	const actual =
		await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
	return {
		...actual,
		and: vi.fn(),
		eq: vi.fn(),
		count: vi.fn(),
	};
});

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
	let mockSelectChain: { from: Mock; where: Mock };

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

		mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn(),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

		(eq as Mock).mockReturnValue("mocked-eq");
		(and as Mock).mockImplementation((..._args) => "mocked-and");
		(count as Mock).mockReturnValue("mocked-count");
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return 0 when the count result is undefined", async () => {
		mockSelectChain.where.mockResolvedValue([]);

		const result = await resolveCommentsCount(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(0);
		expect(mocks.drizzleClient.select).toHaveBeenCalled();
	});

	it("should return the correct count of comments for a post", async () => {
		mockSelectChain.where.mockResolvedValue([{ count: 5 }]);

		const result = await resolveCommentsCount(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(5);
		expect(mocks.drizzleClient.select).toHaveBeenCalled();
		expect(mockSelectChain.from).toHaveBeenCalledWith(commentsTable);
		expect(mockSelectChain.where).toHaveBeenCalledWith("mocked-and");
		expect(eq).toHaveBeenCalledWith(commentsTable.postId, mockPost.id);
		expect(and).toHaveBeenCalledWith("mocked-eq");
	});

	it("should return 0 when the count result is 0", async () => {
		mockSelectChain.where.mockResolvedValue([{ count: 0 }]);

		const result = await resolveCommentsCount(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(0);
		expect(mocks.drizzleClient.select).toHaveBeenCalled();
		expect(mockSelectChain.where).toHaveBeenCalled();
	});

	it("should throw error when database query fails", async () => {
		const dbError = new Error("Database connection failed");
		mockSelectChain.where.mockRejectedValue(dbError);

		await expect(
			resolveCommentsCount(mockPost, {}, ctx, {} as GraphQLResolveInfo),
		).rejects.toThrow("Database connection failed");

		expect(mocks.drizzleClient.select).toHaveBeenCalled();
	});

	it("should handle edge case where post ID is invalid/null", async () => {
		const invalidPost = { ...mockPost, id: null };
		mockSelectChain.where.mockResolvedValue([{ count: 0 }]);

		const result = await resolveCommentsCount(
			invalidPost as unknown as PostType,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toBe(0);
		expect(eq).toHaveBeenCalledWith(commentsTable.postId, null);
	});
});
