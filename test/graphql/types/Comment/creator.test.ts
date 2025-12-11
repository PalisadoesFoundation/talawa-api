import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Comment } from "~/src/graphql/types/Comment/Comment";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Comment/creator";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the creator resolver from the schema
const commentType = schema.getType("Comment") as GraphQLObjectType;
const creatorField = commentType.getFields().creator;
if (!creatorField) {
	throw new Error("creator field not found on Comment type");
}
const creatorResolver = creatorField.resolve as (
	parent: Comment,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("Comment.creator field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockComment: Comment;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
		mockComment = {
			id: "comment-111",
			postId: "post-456",
			creatorId: "creator-789",
			body: "This is a test comment",
			createdAt: new Date("2024-01-15T10:30:00Z"),
			updatedAt: new Date("2024-01-16T10:30:00Z"),
		};
	});

	describe("Null creatorId handling", () => {
		it("should return null when creatorId is null", async () => {
			mockComment.creatorId = null;

			const result = await creatorResolver(mockComment, {}, ctx);

			expect(result).toBeNull();
			// Should not query the database when creatorId is null
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});

	describe("Corrupted data checks", () => {
		it("should throw unexpected error when creator user is not found (corrupted data)", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					return Promise.resolve(undefined);
				},
			);

			await expect(creatorResolver(mockComment, {}, ctx)).rejects.toMatchObject(
				{
					extensions: { code: "unexpected" },
				},
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a comment's creator id that isn't null.",
			);
		});
	});

	describe("Successful resolution", () => {
		it("should return the creator user when creatorId exists and user is found", async () => {
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				creatorUser,
			);

			const result = await creatorResolver(mockComment, {}, ctx);

			expect(result).toEqual(creatorUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Where clause coverage", () => {
		it("should execute usersTable where clause with correct creatorId", async () => {
			const eqMock = vi.fn();
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					return Promise.resolve(creatorUser);
				},
			);

			await creatorResolver(mockComment, {}, ctx);

			// Verify eq was called with correct parameters
			expect(eqMock).toHaveBeenCalledWith("users.id", mockComment.creatorId);
			expect(eqMock).toHaveBeenCalledTimes(1);
		});
	});
});
