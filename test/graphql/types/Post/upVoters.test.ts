import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/upVoters";
import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { schema } from "~/src/graphql/schema";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import type { User } from "~/src/graphql/types/User/User";
import type { DefaultGraphQLConnection as Connection } from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Get the upVoters resolver from the schema
const postType = schema.getType("Post") as GraphQLObjectType;
const upVotersField = postType.getFields().upVoters;
if (!upVotersField?.resolve) {
	throw new Error("UpVoters field or resolver not found in schema");
}
const resolveUpVoters = upVotersField.resolve as GraphQLFieldResolver<
	PostType,
	GraphQLContext
>;
describe("Post Resolver - upVoters", () => {
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
			{ first: 5 },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		expect(result.edges).toHaveLength(2);
		expect(mockUsers[0]?.creator).toBeDefined();
		expect(mockUsers[1]?.creator).toBeDefined();
		expect(result.edges[0]).toBeDefined();
		expect(result.edges[1]).toBeDefined();
		expect(result.edges[0]?.node).toEqual(mockUsers[0]?.creator);
		expect(result.edges[1]?.node).toEqual(mockUsers[1]?.creator);
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

	it("should handle pagination with cursor (after/first)", async () => {
		const mockDate = new Date();
		// Use valid UUID v4 format for creatorId (required by postVotesTableInsertSchema)
		const cursorCreatorId = "550e8400-e29b-41d4-a716-446655440001";
		const resultCreatorId = "550e8400-e29b-41d4-a716-446655440002";

		const mockCursor = Buffer.from(
			JSON.stringify({
				createdAt: mockDate.toISOString(),
				creatorId: cursorCreatorId,
			}),
		).toString("base64url");

		// Mock user that comes after the cursor
		// When using after/first, we expect users with creatorId < cursor.creatorId
		// (because default order is DESC on both createdAt and creatorId)
		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: resultCreatorId,
				creator: {
					id: resultCreatorId,
					name: "User 2",
					emailAddress: "user2@example.com",
				},
			},
		];

		// Mock the select() chain used by exists() subquery
		const mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

		// The resolver makes ONE call to findMany which includes the exists() subquery
		// in the WHERE clause. The exists() validates the cursor exists, and if it does,
		// the query returns records that match the pagination criteria.
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
		expect(result.edges[0].node.id).toBe(resultCreatorId);

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

	it("should handle inversed order (before/last)", async () => {
		const olderDate = new Date("2024-01-01T10:00:00Z");
		const newerDate = new Date("2024-01-01T11:00:00Z");
		// Use valid UUID v4 formats for creatorId (required by postVotesTableInsertSchema)
		const cursorCreatorId = "550e8400-e29b-41d4-a716-446655440003";
		const user1Id = "550e8400-e29b-41d4-a716-446655440001";
		const user2Id = "550e8400-e29b-41d4-a716-446655440002";

		const mockCursor = Buffer.from(
			JSON.stringify({
				createdAt: newerDate.toISOString(),
				creatorId: cursorCreatorId,
			}),
		).toString("base64url");

		// When using before/last, order is inverted to ASC
		// We want users that come BEFORE the cursor (with creatorId > cursor.creatorId in ASC order)
		// The result should be ordered ASC by createdAt, then ASC by creatorId
		const mockUsers = [
			{
				createdAt: olderDate,
				creatorId: user1Id,
				creator: {
					id: user1Id,
					name: "User 1",
					emailAddress: "user1@example.com",
				},
			},
			{
				createdAt: newerDate,
				creatorId: user2Id,
				creator: {
					id: user2Id,
					name: "User 2",
					emailAddress: "user2@example.com",
				},
			},
		];

		// Mock the select() chain used by exists() subquery
		const mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);

		// The resolver makes ONE call to findMany with exists() in the WHERE clause
		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce(
			mockUsers,
		);

		const result = (await resolveUpVoters(
			mockPost,
			{ last: 5, before: mockCursor },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		expect(result.edges).toHaveLength(2);

		if (!result.edges[0] || !result.edges[1]) {
			throw new Error("Expected edges not found in result");
		}
		// Results are reversed by transformToDefaultGraphQLConnection for isInversed=true
		expect(result.edges[0].node.id).toBe(user2Id);
		expect(result.edges[1].node.id).toBe(user1Id);
	});

	it("should throw error for invalid cursor", async () => {
		const invalidCursor = "invalid-base64";
		await expect(
			resolveUpVoters(
				mockPost,
				{ first: 5, after: invalidCursor },
				ctx,
				{} as GraphQLResolveInfo,
			),
		).rejects.toThrow(TalawaGraphQLError);
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

	it("should handle backward pagination without cursor (last only)", async () => {
		const mockDate = new Date();
		const user1Id = "550e8400-e29b-41d4-a716-446655440001";
		const user2Id = "550e8400-e29b-41d4-a716-446655440002";

		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: user1Id,
				creator: {
					id: user1Id,
					name: "User 1",
					emailAddress: "user1@example.com",
				},
			},
			{
				createdAt: mockDate,
				creatorId: user2Id,
				creator: {
					id: user2Id,
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
			{ last: 5 },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		expect(result.edges).toHaveLength(2);
		expect(
			mocks.drizzleClient.query.postVotesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 6,
				orderBy: expect.any(Array),
			}),
		);
	});

	it("should filter out votes with null creator", async () => {
		const mockDate = new Date();
		const validUserId = "550e8400-e29b-41d4-a716-446655440001";

		// Mock findMany to return one vote with a valid creator and one with null
		const mockUsers = [
			{
				createdAt: mockDate,
				creatorId: validUserId,
				creator: {
					id: validUserId,
					name: "Valid User",
					emailAddress: "valid@example.com",
				},
			},
			{
				createdAt: mockDate,
				creatorId: null,
				creator: null, // This should be filtered out
			},
		];

		mocks.drizzleClient.query.postVotesTable.findMany.mockResolvedValueOnce(
			mockUsers,
		);

		const result = (await resolveUpVoters(
			mockPost,
			{ first: 5 },
			ctx,
			{} as GraphQLResolveInfo,
		)) as Connection<User>;

		// Should only include the non-null creator
		expect(result.edges).toHaveLength(1);
		if (!result.edges[0]) {
			throw new Error("Expected edge not found in result");
		}
		expect(result.edges[0].node.id).toBe(validUserId);
	});
});
