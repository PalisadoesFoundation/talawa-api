import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/scalars";
import "~/src/graphql/types/PostAttachment/PostAttachment";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/creator"; // Import to register the field
import {
	type GraphQLFieldResolver,
	GraphQLObjectType,
	type GraphQLResolveInfo,
} from "graphql";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Post Resolver - Creator Field", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let resolveCreator: GraphQLFieldResolver<PostType, GraphQLContext>;

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
		const postType = schema.getType("Post");
		if (!postType || !(postType instanceof GraphQLObjectType)) {
			throw new Error("Post type not found in schema");
		}
		const creatorField = postType.getFields().creator;
		if (!creatorField?.resolve) {
			throw new Error("Creator field or resolver not found in schema");
		}
		resolveCreator = creatorField.resolve;
	});

	it("should return the creator user if they exist", async () => {
		const mockUser = {
			id: "user-123",
			name: "Test User",
			emailAddress: "test@example.com",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
			(options?: { where?: (...args: unknown[]) => unknown }) => {
				const whereClause = options?.where;
				expect(whereClause).toBeDefined();

				if (whereClause) {
					const mockFields = { id: "mock-field-id" };

					const mockEq = vi.fn((field: unknown, value: unknown) => {
						expect(field).toBe(mockFields.id);
						expect(value).toBe(mockPost.creatorId);
						return true;
					});

					const mockOperators = { eq: mockEq };

					const conditionResult = whereClause(mockFields, mockOperators);

					expect(mockEq).toHaveBeenCalledTimes(1);
					expect(conditionResult).toBe(true);
				}

				return Promise.resolve(mockUser);
			},
		);

		const result = await resolveCreator(
			mockPost,
			{},
			ctx,
			{} as GraphQLResolveInfo,
		);

		expect(result).toEqual(mockUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should throw unexpected error if creator user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);
		try {
			await expect(async () => {
				await resolveCreator(mockPost, {}, ctx, {} as GraphQLResolveInfo);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);
		} catch (error) {
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect(error).toMatchObject({ extensions: { code: "unexpected" } });
		}
	});
});
