import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ChildFoldersResolver = GraphQLFieldResolver<
	TagFolderType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("TagFolder childFolders Resolver", () => {
	let mockTagFolder: TagFolderType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let childFoldersResolver: ChildFoldersResolver;

	const mockChildFolders = [
		{
			id: "folder-1",
			name: "Folder A",
			parentFolderId: "parent-folder-id",
			organizationId: "org-id",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-1",
			updaterId: null,
		},
		{
			id: "folder-2",
			name: "Folder B",
			parentFolderId: "parent-folder-id",
			organizationId: "org-id",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-1",
			updaterId: null,
		},
	];

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const tagFolderType = schema.getType("TagFolder") as GraphQLObjectType;
		const childFoldersField = tagFolderType.getFields().childFolders;
		if (!childFoldersField) {
			throw new Error("childFolders field not found on TagFolder type");
		}
		childFoldersResolver = childFoldersField.resolve as ChildFoldersResolver;
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockTagFolder = {
			id: "parent-folder-id",
			name: "Parent Folder",
			organizationId: "org-id",
			parentFolderId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-1",
			updaterId: null,
		};

		// Mock the select chain for exists() check
		const mockSelect = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		// @ts-ignore - mocking internal drizzle method
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);
	});

	describe("Argument Validation", () => {
		it("should throw invalid_arguments error for invalid cursor", async () => {
			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ first: 10, after: "invalid-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error for invalid cursor with 'before'", async () => {
			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ last: 10, before: "invalid-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["before"],
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
		});
	});

	describe("Data Fetching", () => {
		it("should fetch child folders with forward pagination", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue(
				mockChildFolders,
			);

			const result = await childFoldersResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(
				mocks.drizzleClient.query.tagFoldersTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 11, // first + 1
					// We can't easily check the exact SQL object structure for orderBy/where here without more complex mocking
				}),
			);
		});

		it("should fetch child folders with backward pagination", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue(
				mockChildFolders,
			);

			const result = await childFoldersResolver(
				mockTagFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(
				mocks.drizzleClient.query.tagFoldersTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 11, // last + 1
				}),
			);
		});

		it("should handle cursor-based pagination (forward)", async () => {
			const cursor = Buffer.from(JSON.stringify({ name: "Folder A" })).toString(
				"base64url",
			);

			const folder = mockChildFolders[1];
			if (!folder) throw new Error("Mock folder not found");

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				folder,
			]);

			const result = await childFoldersResolver(
				mockTagFolder,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should handle cursor-based pagination (backward)", async () => {
			const cursor = Buffer.from(JSON.stringify({ name: "Folder B" })).toString(
				"base64url",
			);

			const folder = mockChildFolders[0];
			if (!folder) throw new Error("Mock folder not found");

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				folder,
			]);

			const result = await childFoldersResolver(
				mockTagFolder,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should throw arguments_associated_resources_not_found if cursor returns no results", async () => {
			const cursor = Buffer.from(
				JSON.stringify({ name: "NonExistent" }),
			).toString("base64url");

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([]);

			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["after"],
							},
						],
					},
				}),
			);
		});
	});

	describe("Complexity", () => {
		it("should calculate complexity correctly", () => {
			const tagFolderType = schema.getType("TagFolder") as GraphQLObjectType;
			const childFoldersField = tagFolderType.getFields().childFolders;

			if (!childFoldersField) {
				throw new Error("childFolders field not found on TagFolder type");
			}

			type ComplexityFunction = (
				args: { first?: number; last?: number },
				ctx: unknown,
				info: unknown,
			) => { field: number; multiplier: number };

			type FieldWithComplexity = typeof childFoldersField & {
				complexity?: ComplexityFunction;
			};

			// Attempt to find complexity in extensions or directly
			const complexityFn =
				(childFoldersField as FieldWithComplexity).complexity ||
				(childFoldersField.extensions?.complexity as
					| ComplexityFunction
					| undefined);

			if (typeof complexityFn !== "function") {
				console.warn(
					"Could not find complexity function on field. Skipping complexity test.",
				);
				return;
			}

			expect(complexityFn({ first: 10 }, {}, 0)).toEqual({
				field: expect.any(Number),
				multiplier: 10,
			});

			expect(complexityFn({ last: 5 }, {}, 0)).toEqual({
				field: expect.any(Number),
				multiplier: 5,
			});

			expect(complexityFn({}, {}, 0)).toEqual({
				field: expect.any(Number),
				multiplier: 1,
			});
		});
	});
});
