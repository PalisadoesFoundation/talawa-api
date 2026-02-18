import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveOrganization } from "~/src/graphql/types/Post/organization";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";

describe("Post Resolver - Organization Field", () => {
	let mockPost: PostType;
	let ctx: GraphQLContext;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
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

		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		const result = await resolveOrganization(mockPost, {}, ctx);

		expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
		expect(result).toEqual(mockOrganization);
	});

	it("should throw 'unexpected' error when organization is not found (data corruption scenario)", async () => {
		ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveOrganization(mockPost, {}, ctx)).rejects.toMatchObject({
			extensions: {
				code: "unexpected",
			},
		});

		expect(logErrorSpy).toHaveBeenCalledWith(
			{
				postId: "post-123",
				organizationId: "org-123",
			},
			"DataLoader returned null for a post's organization id that isn't null.",
		);
		expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
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
		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization1);

		let result = await resolveOrganization(mockPost, {}, ctx);
		expect(result).toEqual(mockOrganization1);

		// Test with second organization ID
		mockPost.organizationId = "org-222";
		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization2);

		result = await resolveOrganization(mockPost, {}, ctx);
		expect(result).toEqual(mockOrganization2);
	});
});
