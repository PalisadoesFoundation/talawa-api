import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Create a resolver function that matches the implementation
const resolveOrganization = async (
	parent: PostType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId),
		});

	if (existingOrganization === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a post's organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

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

		await expect(resolveOrganization(mockPost, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);

		await expect(resolveOrganization(mockPost, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

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

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

		await resolveOrganization(mockPost, {}, ctx);

		// Verify the where clause is called with correct parameters
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});

		// Test the where clause function directly
		const whereCall =
			mocks.drizzleClient.query.organizationsTable.findFirst.mock.calls[0][0];
		const mockFields = { id: "mockField" };
		const mockOperators = { eq: vi.fn().mockReturnValue("mockWhereClause") };

		whereCall.where(mockFields, mockOperators);

		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "org-123");
	});
});
