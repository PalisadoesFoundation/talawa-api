import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";

describe("TagFolder Resolver - ParentFolder Field", () => {
	let ctx: GraphQLContext;
	let mockTagFolder: TagFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockTagFolder = {
			id: "folder-123",
			name: "Test Folder",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: null,
			organizationId: "org-123",
			parentFolderId: "parent-folder-456",
		} as TagFolderType;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return null if parentFolderId is null", async () => {
		mockTagFolder.parentFolderId = null;

		const tagFolderType = schema.getType("TagFolder");

		if (
			!tagFolderType ||
			tagFolderType.constructor.name !== "GraphQLObjectType"
		) {
			throw new Error("TagFolder type not found in schema");
		}

		const fields = (
			tagFolderType as {
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
		const parentFolderField = fields.parentFolder;

		if (!parentFolderField || !parentFolderField.resolve) {
			throw new Error("parentFolder field or resolver not found");
		}

		const result = await parentFolderField.resolve(mockTagFolder, {}, ctx);
		expect(result).toBeNull();
		expect(
			mocks.drizzleClient.query.tagFoldersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	it("should fetch and return parent folder if parentFolderId exists", async () => {
		const parentFolder = {
			id: "parent-folder-456",
			name: "Parent Folder",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: null,
			organizationId: "org-123",
			parentFolderId: null,
		};

		mockTagFolder.parentFolderId = "parent-folder-456";
		mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValueOnce(
			parentFolder,
		);

		const tagFolderType = schema.getType("TagFolder");

		if (
			!tagFolderType ||
			tagFolderType.constructor.name !== "GraphQLObjectType"
		) {
			throw new Error("TagFolder type not found in schema");
		}

		const fields = (
			tagFolderType as {
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
		const parentFolderField = fields.parentFolder;

		if (!parentFolderField || !parentFolderField.resolve) {
			throw new Error("parentFolder field or resolver not found");
		}

		const result = await parentFolderField.resolve(mockTagFolder, {}, ctx);
		expect(result).toEqual(parentFolder);
		expect(
			mocks.drizzleClient.query.tagFoldersTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("should throw unexpected error and log if parent folder does not exist (database corruption)", async () => {
		mockTagFolder.parentFolderId = "parent-folder-456";
		mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		const tagFolderType = schema.getType("TagFolder");

		if (
			!tagFolderType ||
			tagFolderType.constructor.name !== "GraphQLObjectType"
		) {
			throw new Error("TagFolder type not found in schema");
		}

		const fields = (
			tagFolderType as {
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
		const parentFolderField = fields.parentFolder;

		if (!parentFolderField || !parentFolderField.resolve) {
			throw new Error("parentFolder field or resolver not found");
		}

		await expect(
			parentFolderField.resolve(mockTagFolder, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a tag folder's parent folder id that isn't null.",
		);
	});

	it("should query tagFoldersTable with correct parentFolderId in where clause", async () => {
		const parentFolder = {
			id: "parent-folder-456",
			name: "Parent Folder",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-123",
			updaterId: null,
			organizationId: "org-123",
			parentFolderId: null,
		};

		mockTagFolder.parentFolderId = "parent-folder-456";
		mocks.drizzleClient.query.tagFoldersTable.findFirst.mockResolvedValueOnce(
			parentFolder,
		);

		const tagFolderType = schema.getType("TagFolder");

		if (
			!tagFolderType ||
			tagFolderType.constructor.name !== "GraphQLObjectType"
		) {
			throw new Error("TagFolder type not found in schema");
		}

		const fields = (
			tagFolderType as {
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
		const parentFolderField = fields.parentFolder;

		if (!parentFolderField || !parentFolderField.resolve) {
			throw new Error("parentFolder field or resolver not found");
		}

		await parentFolderField.resolve(mockTagFolder, {}, ctx);

		expect(
			mocks.drizzleClient.query.tagFoldersTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Function),
		});

		// Get the where function that was passed and verify it uses the correct id
		const findFirstCall = mocks.drizzleClient.query.tagFoldersTable.findFirst
			.mock.calls[0] as [{ where?: unknown }] | undefined;

		if (!findFirstCall || !findFirstCall[0]) {
			throw new Error("findFirst was not called with expected arguments");
		}

		const whereClause = findFirstCall[0].where;

		if (typeof whereClause === "function") {
			const mockFields = { id: "id-field" };
			const mockOperators = {
				eq: vi.fn().mockReturnValue("eq-result"),
			};

			whereClause(mockFields, mockOperators);

			expect(mockOperators.eq).toHaveBeenCalledWith(
				"id-field",
				"parent-folder-456",
			);
		}
	});
});
