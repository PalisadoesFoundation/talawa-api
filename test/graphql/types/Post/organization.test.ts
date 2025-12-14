import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { resolveOrganization } from "~/src/graphql/types/Post/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Post Resolver - Organization Field", () => {
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

	it("should successfully return the organization when it exists", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			description: "Test Description",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		const result = await resolveOrganization(mockPost, {}, ctx);

		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
		expect(result).toEqual(mockOrganization);
	});

	it("should throw 'unexpected' error when organization is not found (data corruption scenario)", async () => {
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveOrganization(mockPost, {}, ctx)).rejects.toMatchObject({
			extensions: {
				code: "unexpected",
			},
		});

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a post's organization id that isn't null.",
		);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should call findFirst with correct where clause for organizationId", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
		};

		// Capture the where clause callback
		let capturedWhereClause: any;
		mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
			async (options) => {
				capturedWhereClause = options.where;
				return mockOrganization;
			},
		);

		await resolveOrganization(mockPost, {}, ctx);

		expect(capturedWhereClause).toBeDefined();

		// Test the where clause function
		const mockFields = { id: "mockField" };
		const mockOperators = { eq: vi.fn().mockReturnValue("mockWhereClause") };

		capturedWhereClause(mockFields, mockOperators);

		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "org-123");
	});
});
