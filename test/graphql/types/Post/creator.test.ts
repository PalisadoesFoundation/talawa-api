
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { builder } from "~/src/graphql/builder";
import "~/src/graphql/scalars";
import "~/src/graphql/types/PostAttachment/PostAttachment";
import { type Post as PostType } from "~/src/graphql/types/Post/Post";
import "~/src/graphql/types/Post/creator"; // Import to register the field
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { GraphQLFieldResolver, GraphQLObjectType } from "graphql";

describe("Post Resolver - Creator Field", () => {
    let mockPost: PostType;
    let ctx: GraphQLContext;
    let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
    let resolveCreator: GraphQLFieldResolver<any, any>;

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
        resolveCreator = postType.getFields().creator!.resolve!;
    });


    it("should return the creator user if they exist", async () => {
        const mockUser = {
            id: "user-123",
            name: "Test User",
            emailAddress: "test@example.com",
        };
        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
            mockUser,
        );

        const result = await resolveCreator(mockPost, {}, ctx, {} as any);
        expect(result).toEqual(mockUser);

        expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Function),
            })
        );
    });

    it("should throw unexpected error if creator user does not exist", async () => {
        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
            undefined,
        );

        await expect(async () => {
            await resolveCreator(mockPost, {}, ctx, {} as any);
        }).rejects.toThrow(
            new TalawaGraphQLError({
                extensions: { code: "unexpected" },
            }),
        );
    });
});