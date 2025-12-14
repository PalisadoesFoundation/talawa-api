import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/Post/upVoters";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { DefaultGraphQLConnection as Connection } from "~/src/utilities/defaultGraphQLConnection";
describe("Post Resolver - upVoters", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let resolveUpVoters: GraphQLFieldResolver<PostType, GraphQLContext>;

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

		const schema = builder.toSchema();
		const postType = schema.getType("Post") as GraphQLObjectType;
		const upVotersField = postType.getFields().upVoters;
		if (!upVotersField?.resolve) {
			throw new Error("UpVoters field or resolver not found in schema");
		}
		resolveUpVoters = upVotersField.resolve;
	});

	it("should return upvoters successfully", async () => {
		const mockDate = new Date();
		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: "user-1",
				creator: {
					id: "user-1",
					name: "User 1",
					emailAddress: "user1@example.com",
				},
			},
			{
				createdAt: mockDate,
				creatorId: "user-2",
				creator: {
					id: "user-2",
					name: "User 2",
					emailAddress: "user2@example.com",
				},
			},
		];

		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce(
			mockUsers,
		);

		const result = (await resolveUpVoters(
			mockPost,
			{ limit: 5 },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		expect(result.edges).toHaveLength(2);
		if (!mockUsers[0]?.creator || !mockUsers[1]?.creator) {
			throw new Error("Creator not found in mock users");
		}
		if (!result.edges[0] || !result.edges[1]) {
			throw new Error("Expected edges not found in result");
		}
		expect(result.edges[0].node).toEqual(mockUsers[0].creator);
		expect(result.edges[1].node).toEqual(mockUsers[1].creator);
		expect(
			mocks.drizzleClient.query.postVotesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.any(Object),
				limit: 6,
				orderBy: expect.any(Array),
			}),
		);
	});

	it("should handle pagination with cursor", async () => {
		const mockDate = new Date();
		const mockCursor = Buffer.from(
			JSON.stringify({
				createdAt: mockDate.toISOString(),
				creatorId: "user-1",
			}),
		).toString("base64url");

		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: "user-2",
				creator: {
					id: "user-2",
					name: "User 2",
				},
			},
		];

		// Mock the exists subquery if necessary, or just the main query
		// The implementation uses `exists` in the where clause, which builds a SQL object.
		// We are mocking at the `findMany` level which receives the constructed SQL `where`.
		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce(
			mockUsers,
		);

		const result = (await resolveUpVoters(
			mockPost,
			{ first: 5, after: mockCursor },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;
		expect(result.edges).toHaveLength(1);
		if (!result.edges[0]) {
			throw new Error("Expected edges not found in result");
		}
		expect(result.edges[0].node.id).toBe("user-2");
	});

	it("should handle inversed order (before cursor)", async () => {
		const mockDate = new Date();
		const mockCursor = Buffer.from(
			JSON.stringify({
				createdAt: mockDate.toISOString(),
				creatorId: "user-3",
			}),
		).toString("base64url");

		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: "user-2",
				creator: {
					id: "user-2",
					name: "User 2",
				},
			},
		];

		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce(
			mockUsers,
		);

		const result = (await resolveUpVoters(
			mockPost,
			{ last: 5, before: mockCursor },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		// transformToDefaultGraphQLConnection handles the reversing of edges for last/before
		expect(result.edges).toHaveLength(1);
	});

	it("should throw error for invalid cursor", async () => {
		const invalidCursor = "invalid-base64";

		await expect(async () => {
			await resolveUpVoters(
				mockPost,
				{ first: 5, after: invalidCursor },
				ctx,
				{} as GraphQLResolveInfo,
			);
		}).rejects.toThrow(TalawaGraphQLError);
	});

	it("should throw error if cursor provided but no results found (invalid cursor context)", async () => {
		const mockDate = new Date();
		const mockCursor = Buffer.from(
			JSON.stringify({
				createdAt: mockDate.toISOString(),
				creatorId: "user-1",
			}),
		).toString("base64url");

		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce([]);

		await expect(async () => {
			await resolveUpVoters(
				mockPost,
				{ first: 5, after: mockCursor },
				ctx,
				{} as GraphQLResolveInfo,
			);
		}).rejects.toThrow(TalawaGraphQLError);
	});
});
