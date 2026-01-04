import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";

/**
 * Unit tests for TagFolder.organization resolver field.
 *
 * This test suite validates the resolver's behavior when fetching the organization
 * associated with a tag folder, including:
 * - Successfully returning the organization when it exists
 * - Throwing an error when organization is not found (data corruption)
 * - Proper error logging for database corruption scenarios
 *
 * These tests use DataLoader mocking to test the resolver behavior.
 */
describe("TagFolder Resolver - Organization Field", () => {
	let mockTagFolder: TagFolderType;
	let ctx: GraphQLContext;
	let organizationField: {
		resolve?: (
			parent: TagFolderType,
			args: Record<string, unknown>,
			context: GraphQLContext,
		) => Promise<unknown>;
	};

	beforeEach(async () => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;

		mockTagFolder = {
			id: "tag-folder-123",
			name: "Test Tag Folder",
			organizationId: "org-123",
			parentFolderId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: null,
		};

		// Get the organization field resolver from the schema
		const { schema } = await import("~/src/graphql/schema");
		const tagFolderTypeFromSchema = schema.getType("TagFolder");

		if (
			!tagFolderTypeFromSchema ||
			tagFolderTypeFromSchema.constructor.name !== "GraphQLObjectType"
		) {
			throw new Error("TagFolder type not found in schema");
		}

		const fields = (
			tagFolderTypeFromSchema as {
				getFields: () => Record<
					string,
					{
						resolve?: (
							parent: TagFolderType,
							args: Record<string, unknown>,
							context: GraphQLContext,
						) => Promise<unknown>;
					}
				>;
			}
		).getFields();

		if (!fields.organization || !fields.organization.resolve) {
			throw new Error("Organization field or resolver not found");
		}
		organizationField = fields.organization;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should successfully return organization when it exists", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			description: "Test Description",
			addressLine1: "123 Main St",
			addressLine2: null,
			city: "Test City",
			state: "Test State",
			postalCode: "12345",
			countryCode: "US",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: null,
		};

		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		const result = await organizationField.resolve?.(mockTagFolder, {}, ctx);

		expect(result).toEqual(mockOrganization);
		expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
	});

	it("should throw 'unexpected' error when organization is not found (database corruption)", async () => {
		ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		let thrownError: unknown;
		try {
			await organizationField.resolve?.(mockTagFolder, {}, ctx);
		} catch (error) {
			thrownError = error;
		}

		expect(thrownError).toBeDefined();
		expect(thrownError).toHaveProperty("extensions");
		expect(
			(thrownError as { extensions: { code: string } }).extensions.code,
		).toBe("unexpected");

		expect(logErrorSpy).toHaveBeenCalledWith(
			{
				tagFolderId: mockTagFolder.id,
				organizationId: mockTagFolder.organizationId,
			},
			"DataLoader returned an empty array for a tag folder's organization id that isn't null.",
		);
	});

	it("should call DataLoader with correct organization ID", async () => {
		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			description: "Test Description",
		};

		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		await organizationField.resolve?.(mockTagFolder, {}, ctx);

		expect(ctx.dataloaders.organization.load).toHaveBeenCalledTimes(1);
		expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith(
			mockTagFolder.organizationId,
		);
	});

	it("should handle different organizationId values correctly", async () => {
		const differentOrgId = "different-org-456";
		const mockTagFolderWithDifferentOrg: TagFolderType = {
			...mockTagFolder,
			organizationId: differentOrgId,
		};

		const mockOrganization = {
			id: differentOrgId,
			name: "Different Organization",
			description: "Different Description",
			addressLine1: "456 Other St",
			addressLine2: null,
			city: "Other City",
			state: "Other State",
			postalCode: "67890",
			countryCode: "US",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-456",
			updaterId: null,
		};

		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		const result = await organizationField.resolve?.(
			mockTagFolderWithDifferentOrg,
			{},
			ctx,
		);

		expect(result).toEqual(mockOrganization);
		expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith(
			differentOrgId,
		);
	});
});
