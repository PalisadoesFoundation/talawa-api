import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import type { Mock } from "vitest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { TagFolder as TagFolderType } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type TagsResolver = GraphQLFieldResolver<
	TagFolderType,
	GraphQLContext,
	Record<string, unknown>
>;

describe("TagFolder Tags Resolver Tests", () => {
	let mockTagFolder: TagFolderType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let tagsResolver: TagsResolver;

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	const expectInvalidArgumentsError = (
		error: unknown,
		expectedArgumentPath: string,
	): void => {
		expect(error).toBeInstanceOf(TalawaGraphQLError);
		const graphQLError = error as TalawaGraphQLError;
		expect(graphQLError.extensions.code).toBe("invalid_arguments");
		expect(graphQLError.extensions.issues).toBeDefined();
		expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
		const issues = graphQLError.extensions.issues as Array<{
			argumentPath?: string[];
		}>;
		expect(
			issues.some((issue) =>
				issue.argumentPath?.includes(expectedArgumentPath),
			),
		).toBe(true);
	};

	beforeAll(() => {
		const tagFolderType = schema.getType("TagFolder") as GraphQLObjectType;
		const tagsField = tagFolderType.getFields().tags;
		if (!tagsField) {
			throw new Error("Tags field not found on TagFolder type");
		}
		tagsResolver = tagsField.resolve as TagsResolver;
		if (!tagsResolver) {
			throw new Error("Tags resolver not found on TagFolder type");
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockTagFolder = {
			id: "tagfolder-123",
			name: "Test Tag Folder",
			organizationId: "org-456",
			parentFolderId: null,
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			creatorId: null,
			updaterId: null,
		};
	});

	describe("Complexity Calculation", () => {
		let tagsComplexityFunction: (args: Record<string, unknown>) => {
			field: number;
			multiplier: number;
		};

		beforeAll(() => {
			const tagFolderType = schema.getType("TagFolder") as GraphQLObjectType;
			const tagsField = tagFolderType.getFields().tags;
			if (
				!tagsField ||
				!tagsField.extensions ||
				!tagsField.extensions.complexity
			) {
				throw new Error(
					"Complexity function not found on TagFolder.tags field",
				);
			}
			tagsComplexityFunction = tagsField.extensions.complexity as (
				args: Record<string, unknown>,
			) => { field: number; multiplier: number };
		});

		it("should return correct complexity with first argument", () => {
			const result = tagsComplexityFunction({ first: 20 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(20);
			expect(result.field).toBeDefined();
		});

		it("should return correct complexity with last argument", () => {
			const result = tagsComplexityFunction({ last: 15 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(15);
			expect(result.field).toBeDefined();
		});

		it("should return complexity with fallback multiplier of 1 when no first or last", () => {
			const result = tagsComplexityFunction({});
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(1);
			expect(result.field).toBeDefined();
		});
		it("should use first when both first and last are provided", () => {
			const result = tagsComplexityFunction({ first: 5, last: 10 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(5);
			expect(result.field).toBeDefined();
		});
	});
	describe("Field Configuration", () => {
		it("should have the correct description on the tags field", () => {
			const tagFolderType = schema.getType("TagFolder") as GraphQLObjectType;
			const tagsField = tagFolderType.getFields().tags;
			if (!tagsField) {
				throw new Error("Tags field not found on TagFolder type");
			}
			expect(tagsField.description).toBeDefined();
			expect(tagsField.description).toContain("GraphQL connection");
			expect(tagsField.description).toContain("tags");
		});
	});
	describe("Argument Validation", () => {
		it("should throw invalid_arguments for missing required pagination arguments", async () => {
			let thrownError: unknown;
			try {
				await tagsResolver(mockTagFolder, {}, ctx, mockResolveInfo);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("invalid_arguments");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
		});
	});

	describe("Cursor Validation", () => {
		it("should throw invalid_arguments for malformed base64 cursor (forward)", async () => {
			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ first: 10, after: "invalid-base64!!!" },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expectInvalidArgumentsError(thrownError, "after");
		});

		it("should throw invalid_arguments for malformed base64 cursor (backward)", async () => {
			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ last: 10, before: "invalid-base64!!!" },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expectInvalidArgumentsError(thrownError, "before");
		});

		it("should throw invalid_arguments for invalid JSON in cursor", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");
			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expectInvalidArgumentsError(thrownError, "after");
		});

		it("should throw invalid_arguments for cursor with invalid schema", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					invalidField: "value",
				}),
			).toString("base64url");

			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expectInvalidArgumentsError(thrownError, "after");
		});
	});

	describe("Forward Pagination", () => {
		it("should retrieve tags with forward pagination (no cursor)", async () => {
			const mockTags = [
				{
					id: "tag-1",
					name: "Alpha",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				{
					id: "tag-2",
					name: "Beta",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-02"),
					updatedAt: new Date("2024-01-02"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = (await tagsResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string }; cursor: string }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(2);
			expect(result.edges[0]).toBeDefined();
			expect(result.edges[0]?.node.name).toBe("Alpha");
			expect(result.edges[1]).toBeDefined();
			expect(result.edges[1]?.node.name).toBe("Beta");

			expect(result.edges[0]?.cursor).toBeDefined();
			const cursor = result.edges[0]?.cursor ?? "";

			let decodedCursor: unknown;
			expect(() => {
				const decodedString = Buffer.from(cursor, "base64url").toString(
					"utf-8",
				);
				decodedCursor = JSON.parse(decodedString);
			}).not.toThrow();

			// Validate decoded cursor structure
			expect(typeof decodedCursor).toBe("object");
			expect(decodedCursor).not.toBeNull();
			expect(decodedCursor).toHaveProperty("name");
			expect(typeof (decodedCursor as { name?: unknown }).name).toBe("string");
			expect((decodedCursor as { name: string }).name.length).toBeGreaterThan(
				0,
			);
		});

		it("should retrieve tags with forward pagination (with cursor)", async () => {
			const cursorTag = {
				name: "Beta",
			};
			const validCursor = Buffer.from(JSON.stringify(cursorTag)).toString(
				"base64url",
			);

			const mockTags = [
				{
					id: "tag-3",
					name: "Gamma",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-03"),
					updatedAt: new Date("2024-01-03"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = (await tagsResolver(
				mockTagFolder,
				{ first: 10, after: validCursor },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(1);
			expect(result.edges[0]?.node.name).toBe("Gamma");
		});

		it("should throw arguments_associated_resources_not_found when forward cursor points to non-existent tag", async () => {
			const validCursor = Buffer.from(
				JSON.stringify({
					name: "NonExistent",
				}),
			).toString("base64url");

			// Mock empty result for cursor validation query
			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue([]);

			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ first: 10, after: validCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe(
				"arguments_associated_resources_not_found",
			);
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{
				argumentPath?: string[];
			}>;
			expect(
				issues.some((issue) => issue.argumentPath?.includes("after")),
			).toBe(true);
		});
	});

	describe("Backward Pagination", () => {
		it("should retrieve tags with backward pagination (no cursor)", async () => {
			const mockTags = [
				{
					id: "tag-1",
					name: "Alpha",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				{
					id: "tag-2",
					name: "Beta",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-02"),
					updatedAt: new Date("2024-01-02"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = (await tagsResolver(
				mockTagFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(2);
			// Results should be in descending order
			expect(result.edges[0]?.node.name).toBe("Beta");
			expect(result.edges[1]?.node.name).toBe("Alpha");
		});

		it("should retrieve tags with backward pagination (with cursor)", async () => {
			const cursorTag = {
				name: "Beta",
			};
			const validCursor = Buffer.from(JSON.stringify(cursorTag)).toString(
				"base64url",
			);

			const mockTags = [
				{
					id: "tag-1",
					name: "Alpha",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = (await tagsResolver(
				mockTagFolder,
				{ last: 10, before: validCursor },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(1);
			expect(result.edges[0]?.node.name).toBe("Alpha");
		});

		it("should throw arguments_associated_resources_not_found when backward cursor points to non-existent tag", async () => {
			const validCursor = Buffer.from(
				JSON.stringify({
					name: "NonExistent",
				}),
			).toString("base64url");

			// Mock empty result for cursor validation query
			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue([]);

			let thrownError: unknown;
			try {
				await tagsResolver(
					mockTagFolder,
					{ last: 10, before: validCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe(
				"arguments_associated_resources_not_found",
			);
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{
				argumentPath?: string[];
			}>;
			expect(
				issues.some((issue) => issue.argumentPath?.includes("before")),
			).toBe(true);
		});
	});

	describe("Tag Retrieval", () => {
		it("should query tags with where clause, orderBy, and pagination limit", async () => {
			const mockTags = [
				{
					id: "tag-1",
					name: "Tag1",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = await tagsResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(mocks.drizzleClient.query.tagsTable.findMany).toHaveBeenCalled();

			const callArgs = (mocks.drizzleClient.query.tagsTable.findMany as Mock)
				.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs?.where).toBeDefined();
			expect(callArgs?.orderBy).toBeDefined();
			expect(callArgs?.limit).toBe(11);
		});

		it("should handle empty results", async () => {
			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue([]);

			const result = (await tagsResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<unknown> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(0);
		});

		it("should create proper GraphQL connection with pageInfo", async () => {
			const mockTags = [
				{
					id: "tag-1",
					name: "Tag1",
					organizationId: mockTagFolder.organizationId,
					parentTagId: null,
					tagFolderId: mockTagFolder.id,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
			];

			mocks.drizzleClient.query.tagsTable.findMany.mockResolvedValue(mockTags);

			const result = (await tagsResolver(
				mockTagFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as {
				edges: Array<unknown>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.pageInfo).toBeDefined();
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).not.toBeNull();
			expect(result.pageInfo.endCursor).not.toBeNull();
			expect(result.pageInfo.startCursor).toBe(result.pageInfo.endCursor);
		});
	});
});
