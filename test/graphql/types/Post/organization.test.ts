import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { resolveOrganization } from "~/src/graphql/types/Post/organization";

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

	afterEach(() => {
		vi.restoreAllMocks();
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
			"Postgres select operation returned undefined for a post's organization id that isn't null.",
		);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should call findFirst with correct where clause using parent.organizationId", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
		};

		// Mock implementation that validates the where clause
		mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
			({ where }) => {
				const mockFields = { id: "mock-field-id" };
				const mockOperators = {
					eq: vi.fn((field, value) => ({ field, value })),
				};

				// Execute the where function
				where(mockFields, mockOperators);

				// Verify eq was called with correct field and parent's organizationId
				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.id,
					mockPost.organizationId,
				);

				return Promise.resolve(mockOrganization);
			},
		);

		await resolveOrganization(mockPost, {}, ctx);

		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should handle different organizationId values correctly", async () => {
		const mockOrganization1 = {
			id: "org-111",
			name: "Organization 1",
		};

		const mockOrganization2 = {
			id: "org-222",
			name: "Organization 2",
		};

		// Test with first organization ID
		mockPost.organizationId = "org-111";
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
			mockOrganization1,
		);

		let result = await resolveOrganization(mockPost, {}, ctx);
		expect(result).toEqual(mockOrganization1);

		// Test with second organization ID
		mockPost.organizationId = "org-222";
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
			mockOrganization2,
		);

		result = await resolveOrganization(mockPost, {}, ctx);
		expect(result).toEqual(mockOrganization2);

		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(2);
	});
});
