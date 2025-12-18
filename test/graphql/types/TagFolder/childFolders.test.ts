import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const createCursor = (data: Record<string, unknown>): string => {
	return Buffer.from(JSON.stringify(data)).toString("base64url");
};

const makeResolveInfo = (
	overrides: Partial<GraphQLResolveInfo> = {},
): GraphQLResolveInfo => {
	return {
		fieldName: "childFolders",
		fieldNodes: [],
		returnType: schema.getType("TagFolder") as GraphQLObjectType,
		parentType: schema.getType("TagFolder") as GraphQLObjectType,
		path: { key: "childFolders", prev: undefined },
		schema: schema,
		fragments: {},
		rootValue: {},
		operation: {
			kind: "OperationDefinition",
			operation: "query",
			selectionSet: { kind: "SelectionSet", selections: [] },
		},
		variableValues: {},
		...overrides,
	} as GraphQLResolveInfo;
};

interface Connection {
	edges: Array<{ node: Record<string, unknown> }>;
	pageInfo: {
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		startCursor?: string | null;
		endCursor?: string | null;
	};
}

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

	// The resolver does not use the info argument, so we can cast an empty object.
	const mockResolveInfo = makeResolveInfo();

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

		it("should throw invalid_arguments error when both first and last are provided", async () => {
			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ first: 10, last: 10 },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["last"],
								message:
									'Argument "last" cannot be provided with argument "first".',
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error when first is used with before", async () => {
			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ first: 10, before: "some-cursor" },
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
								message:
									'Argument "before" cannot be provided with argument "first".',
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error when last is used with after", async () => {
			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ last: 10, after: "some-cursor" },
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
								message:
									'Argument "after" cannot be provided with argument "last".',
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error when neither first nor last is provided", async () => {
			await expect(
				childFoldersResolver(mockTagFolder, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["first"],
								message:
									'A non-null value for argument "first" must be provided.',
							},
							{
								argumentPath: ["last"],
								message:
									'A non-null value for argument "last" must be provided.',
							},
						],
					},
				}),
			);
		});
	});

	describe("Data Fetching", () => {
		it("should fetch child folders with forward pagination", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				...mockChildFolders,
			]);

			const result = await childFoldersResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();

			// Validate connection structure
			const connection = result as Connection;
			expect(connection.edges).toBeDefined();
			expect(connection.pageInfo).toBeDefined();
			expect(connection.edges).toHaveLength(mockChildFolders.length);

			// Validate node content
			const firstEdge = connection.edges[0];
			const secondEdge = connection.edges[1];
			const firstMock = mockChildFolders[0];
			const secondMock = mockChildFolders[1];

			if (!firstEdge || !secondEdge || !firstMock || !secondMock) {
				throw new Error("Missing edges or mock data");
			}

			expect(firstEdge.node).toEqual(firstMock);
			expect(secondEdge.node).toEqual(secondMock);

			// Validate pageInfo
			// Since we returned 2 items and limit was 11 (first + 1), hasNextPage should be false
			expect(connection.pageInfo.hasNextPage).toBe(false);
			expect(connection.pageInfo.hasPreviousPage).toBe(false);

			expect(
				mocks.drizzleClient.query.tagFoldersTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 11, // first + 1
				}),
			);
		});
		it("should fetch child folders with backward pagination", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				...mockChildFolders,
			]);

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
			const cursor = createCursor({ name: "Folder A" });

			const folder = mockChildFolders[1] as (typeof mockChildFolders)[number];

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

			// Verify exists() check was constructed
			expect(mocks.drizzleClient.select).toHaveBeenCalled();
			const mockSelect = mocks.drizzleClient.select.mock.results[0]?.value;
			if (!mockSelect) {
				throw new Error("Mock select return value is undefined");
			}
			expect(mockSelect.from).toHaveBeenCalledWith(tagFoldersTable);
			expect(mockSelect.where).toHaveBeenCalled();
		});

		it("should handle cursor-based pagination (backward)", async () => {
			const cursor = createCursor({ name: "Folder B" });

			const folder = mockChildFolders[0] as (typeof mockChildFolders)[number];

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

			// Verify exists() check was constructed
			expect(mocks.drizzleClient.select).toHaveBeenCalled();
			const mockSelect = mocks.drizzleClient.select.mock.results[0]?.value;
			if (!mockSelect) {
				throw new Error("Mock select return value is undefined");
			}
			expect(mockSelect.from).toHaveBeenCalledWith(tagFoldersTable);
			expect(mockSelect.where).toHaveBeenCalled();
		});

		it("should throw arguments_associated_resources_not_found if cursor returns no results", async () => {
			const cursor = createCursor({ name: "NonExistent" });

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

		it("should throw arguments_associated_resources_not_found if cursor returns no results (backward)", async () => {
			const cursor = createCursor({ name: "Folder A" });

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([]);

			await expect(
				childFoldersResolver(
					mockTagFolder,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["before"],
							},
						],
					},
				}),
			);
		});

		it("should handle empty connection", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([]);

			// Test with first
			const resultForward = (await childFoldersResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(resultForward.edges).toEqual([]);
			expect(resultForward.pageInfo.hasNextPage).toBe(false);
			expect(resultForward.pageInfo.hasPreviousPage).toBe(false);
			expect(resultForward.pageInfo.startCursor).toBeNull();
			expect(resultForward.pageInfo.endCursor).toBeNull();

			// Test with last
			const resultBackward = (await childFoldersResolver(
				mockTagFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(resultBackward.edges).toEqual([]);
			expect(resultBackward.pageInfo.hasNextPage).toBe(false);
			expect(resultBackward.pageInfo.hasPreviousPage).toBe(false);
			expect(resultBackward.pageInfo.startCursor).toBeNull();
			expect(resultBackward.pageInfo.endCursor).toBeNull();
		});

		it("should handle sentinel boundary pagination (forward)", async () => {
			const manyMockFolders = Array.from({ length: 11 }, (_, i) => ({
				id: `folder-${i}`,
				name: `Folder ${i}`,
				organizationId: "org-id",
				parentFolderId: "parent-folder-id",
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-1",
				updaterId: null,
			}));

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue(
				manyMockFolders,
			);

			const result = (await childFoldersResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.edges).toHaveLength(10);
			expect(result.pageInfo.hasNextPage).toBe(true);
			expect(
				mocks.drizzleClient.query.tagFoldersTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 11,
				}),
			);
		});

		it("should handle sentinel boundary pagination (backward)", async () => {
			const manyMockFolders = Array.from({ length: 11 }, (_, i) => ({
				id: `folder-${i}`,
				name: `Folder ${i}`,
				organizationId: "org-id",
				parentFolderId: "parent-folder-id",
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-1",
				updaterId: null,
			}));

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue(
				manyMockFolders,
			);

			const result = (await childFoldersResolver(
				mockTagFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.edges).toHaveLength(10);
			expect(result.pageInfo.hasPreviousPage).toBe(true);
			expect(
				mocks.drizzleClient.query.tagFoldersTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 11,
				}),
			);
		});

		it("should set correct startCursor and endCursor values", async () => {
			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				...mockChildFolders,
			]);

			const result = (await childFoldersResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();

			// Verify cursors can be decoded
			if (result.pageInfo.startCursor) {
				const decodedStart = JSON.parse(
					Buffer.from(result.pageInfo.startCursor, "base64url").toString(
						"utf-8",
					),
				);
				expect(decodedStart.name).toBe("Folder A");
			}

			if (result.pageInfo.endCursor) {
				const decodedEnd = JSON.parse(
					Buffer.from(result.pageInfo.endCursor, "base64url").toString("utf-8"),
				);
				expect(decodedEnd.name).toBe("Folder B");
			}
		});

		it("should set hasPreviousPage to true when using after cursor in forward pagination", async () => {
			const cursor = createCursor({ name: "Folder A" });

			const folder = mockChildFolders[1] as (typeof mockChildFolders)[number];

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				folder,
			]);

			const result = (await childFoldersResolver(
				mockTagFolder,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			)) as Connection;

			// When using 'after' cursor in forward pagination, hasPreviousPage should be true
			expect(result.pageInfo.hasPreviousPage).toBe(true);
			expect(result.pageInfo.hasNextPage).toBe(false);
		});

		it("should set hasNextPage to true when using before cursor in backward pagination", async () => {
			const cursor = createCursor({ name: "Folder B" });

			const folder = mockChildFolders[0] as (typeof mockChildFolders)[number];

			mocks.drizzleClient.query.tagFoldersTable.findMany.mockResolvedValue([
				folder,
			]);

			const result = (await childFoldersResolver(
				mockTagFolder,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			)) as Connection;

			// When using 'before' cursor in backward pagination, hasNextPage should be true
			expect(result.pageInfo.hasNextPage).toBe(true);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
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

			expect(typeof complexityFn).toBe("function");
			if (typeof complexityFn !== "function") return;

			const resultFirst = complexityFn({ first: 10 }, {}, 0);
			expect(resultFirst.field).toBeGreaterThan(0);
			expect(resultFirst.multiplier).toBe(10);

			const resultLast = complexityFn({ last: 5 }, {}, 0);
			expect(resultLast.field).toBeGreaterThan(0);
			expect(resultLast.multiplier).toBe(5);

			const resultDefault = complexityFn({}, {}, 0);
			expect(resultDefault.field).toBeGreaterThan(0);
			expect(resultDefault.multiplier).toBe(1);
		});
	});
});
