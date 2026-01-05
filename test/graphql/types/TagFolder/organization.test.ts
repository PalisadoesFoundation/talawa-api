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
 * - Throwing an error when organization data is corrupted (organizationId exists but no organization found)
 * - Proper error logging for database corruption scenarios
 *
 * These tests follow the project's testing guidelines:
 * - Uses createMockGraphQLContext for consistent mocking
 * - Tests both success and error paths
 * - Validates error codes and logging behavior
 * - Includes afterEach cleanup for mock isolation
 */
describe("TagFolder Resolver - Organization Field", () => {
	let mockTagFolder: TagFolderType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

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

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

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
		const organizationField = fields.organization;

		if (!organizationField || !organizationField.resolve) {
			throw new Error("Organization field or resolver not found");
		}

		const result = await organizationField.resolve(mockTagFolder, {}, ctx);

		expect(result).toEqual(mockOrganization);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should throw 'unexpected' error when organization is not found (database corruption)", async () => {
		// Mock the database query to return undefined, simulating a corrupted state
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		// Spy on the log.error method
		const logErrorSpy = vi.spyOn(ctx.log, "error");

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
		const organizationField = fields.organization;

		if (!organizationField || !organizationField.resolve) {
			throw new Error("Organization field or resolver not found");
		}

		// Execute resolver and expect it to throw with correct error code
		let thrownError: unknown;
		try {
			await organizationField.resolve(mockTagFolder, {}, ctx);
		} catch (error) {
			thrownError = error;
		}

		// Verify error was thrown and has correct extensions
		expect(thrownError).toBeDefined();
		expect(thrownError).toHaveProperty("extensions");
		expect(
			(thrownError as { extensions: { code: string } }).extensions.code,
		).toBe("unexpected");

		// Verify that an error was logged
		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a tag folder's organization id that isn't null.",
		);
	});

	it("should call database with correct parameters", async () => {
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

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

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
		const organizationField = fields.organization;

		if (!organizationField || !organizationField.resolve) {
			throw new Error("Organization field or resolver not found");
		}

		await organizationField.resolve(mockTagFolder, {}, ctx);

		// Verify the database was queried correctly
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledTimes(1);
		expect(
			mocks.drizzleClient.query.organizationsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});

		// Verify the where clause works correctly by extracting and testing it
		const mockCalls = mocks.drizzleClient.query.organizationsTable.findFirst
			.mock.calls as unknown as Array<
			[
				{
					where: (
						fields: Record<string, unknown>,
						operators: Record<string, unknown>,
					) => unknown;
				},
			]
		>;

		if (mockCalls.length > 0 && mockCalls[0]) {
			const firstCallArg = mockCalls[0][0];
			if (firstCallArg && typeof firstCallArg.where === "function") {
				const whereFunction = firstCallArg.where;
				const mockFields = { id: "field_id" };
				const mockOperators = {
					eq: vi.fn((field, value) => ({ field, value })),
				};
				whereFunction(mockFields, mockOperators);

				expect(mockOperators.eq).toHaveBeenCalledWith(
					"field_id",
					mockTagFolder.organizationId,
				);
			}
		}
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

		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization,
		);

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
		const organizationField = fields.organization;

		if (!organizationField || !organizationField.resolve) {
			throw new Error("Organization field or resolver not found");
		}

		const result = (await organizationField.resolve(
			mockTagFolderWithDifferentOrg,
			{},
			ctx,
		)) as typeof mockOrganization;

		expect(result).toEqual(mockOrganization);
		expect(result.id).toBe(differentOrgId);
	});
});
