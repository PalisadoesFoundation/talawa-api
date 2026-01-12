import type {
	GraphQLField,
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const createCursor = (data: Record<string, unknown>): string =>
	Buffer.from(JSON.stringify(data)).toString("base64url");

const makeResolveInfo = (
	overrides: Partial<GraphQLResolveInfo> = {},
): GraphQLResolveInfo =>
	({
		fieldName: "childFolders",
		fieldNodes: [],
		returnType: schema.getType("AgendaFolder") as GraphQLObjectType,
		parentType: schema.getType("AgendaFolder") as GraphQLObjectType,
		path: { key: "childFolders", prev: undefined },
		schema,
		fragments: {},
		rootValue: {},
		operation: {
			kind: "OperationDefinition",
			operation: "query",
			selectionSet: { kind: "SelectionSet", selections: [] },
		},
		variableValues: {},
		...overrides,
	}) as GraphQLResolveInfo;

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
	AgendaFolderType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("AgendaFolder childFolders Resolver", () => {
	let mockAgendaFolder: AgendaFolderType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let childFoldersResolver: ChildFoldersResolver;

	const mockChildFolders = [
		{
			id: "00000000-0000-4000-8000-000000000001",
			name: "Folder A",
			parentFolderId: "00000000-0000-4000-8000-000000000000",
			eventId: "00000000-0000-4000-8000-000000000100",
			isAgendaItemFolder: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
		},
		{
			id: "00000000-0000-4000-8000-000000000002",
			name: "Folder B",
			parentFolderId: "00000000-0000-4000-8000-000000000000",
			eventId: "00000000-0000-4000-8000-000000000100",
			isAgendaItemFolder: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
		},
	];

	const mockResolveInfo = makeResolveInfo();

	beforeAll(() => {
		const type = schema.getType("AgendaFolder") as GraphQLObjectType;
		const field = type.getFields().childFolders;
		if (!field) throw new Error("childFolders field not found");
		childFoldersResolver = field.resolve as ChildFoldersResolver;
	});

	beforeEach(() => {
		const setup = createMockGraphQLContext(true, "user-123");
		ctx = setup.context;
		mocks = setup.mocks;

		mockAgendaFolder = {
			id: "00000000-0000-4000-8000-000000000000",
			name: "Parent Folder",
			eventId: "00000000-0000-4000-8000-000000000100",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "00000000-0000-4000-8000-000000000200",
			updaterId: null,
			description: "desc",
			sequence: 1,
			isDefaultFolder: false,
			organizationId: "orgId-123",
		};

		const mockSelect = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);
	});

	describe("Argument Validation", () => {
		it("invalid cursor (after)", async () => {
			await expect(
				childFoldersResolver(
					mockAgendaFolder,
					{ first: 10, after: "invalid-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["after"], message: "Not a valid cursor." },
						],
					},
				}),
			);
		});

		it("invalid cursor (before)", async () => {
			await expect(
				childFoldersResolver(
					mockAgendaFolder,
					{ last: 10, before: "invalid-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["before"], message: "Not a valid cursor." },
						],
					},
				}),
			);
		});

		it("first + last conflict", async () => {
			await expect(
				childFoldersResolver(
					mockAgendaFolder,
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

		it("first + before conflict", async () => {
			await expect(
				childFoldersResolver(
					mockAgendaFolder,
					{ first: 10, before: "x" },
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

		it("last + after conflict", async () => {
			await expect(
				childFoldersResolver(
					mockAgendaFolder,
					{ last: 10, after: "x" },
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

		it("missing first/last", async () => {
			await expect(
				childFoldersResolver(mockAgendaFolder, {}, ctx, mockResolveInfo),
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
		it("forward pagination", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				mockChildFolders,
			);

			const result = (await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);

			expect(
				mocks.drizzleClient.query.agendaFoldersTable.findMany,
			).toHaveBeenCalledWith(expect.objectContaining({ limit: 11 }));
		});

		it("backward pagination", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				mockChildFolders,
			);

			await childFoldersResolver(
				mockAgendaFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(
				mocks.drizzleClient.query.agendaFoldersTable.findMany,
			).toHaveBeenCalledWith(expect.objectContaining({ limit: 11 }));
		});

		it("cursor forward", async () => {
			const folderA = mockChildFolders[0];
			const folderB = mockChildFolders[1];
			if (!folderA || !folderB) throw new Error("Mock data not initialized");

			const cursor = createCursor({
				id: folderA.id,
				name: "Folder A",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderB,
			]);

			await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			const mockSelect = mocks.drizzleClient.select.mock.results[0]?.value;
			expect(mockSelect.from).toHaveBeenCalledWith(agendaFoldersTable);
			expect(mockSelect.where).toHaveBeenCalled();
		});

		it("cursor backward", async () => {
			const folderA = mockChildFolders[0];
			const folderB = mockChildFolders[1];
			if (!folderA || !folderB) throw new Error("Mock data not initialized");

			const cursor = createCursor({
				id: folderB.id,
				name: "Folder B",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderA,
			]);

			await childFoldersResolver(
				mockAgendaFolder,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			);

			const mockSelect = mocks.drizzleClient.select.mock.results[0]?.value;
			expect(mockSelect.from).toHaveBeenCalledWith(agendaFoldersTable);
			expect(mockSelect.where).toHaveBeenCalled();
		});

		it("cursor not found (forward)", async () => {
			const cursor = createCursor({
				id: "00000000-0000-4000-8000-999999999999",
				name: "NonExistent",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			const mockSelect = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnValue([]),
			};
			mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);

			await expect(
				childFoldersResolver(
					mockAgendaFolder,
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

		it("cursor not found (backward)", async () => {
			const folderA = mockChildFolders[0];
			if (!folderA) throw new Error("Mock data not initialized");

			const cursor = createCursor({
				id: folderA.id,
				name: "Folder A",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				childFoldersResolver(
					mockAgendaFolder,
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

		it("empty connection", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				[],
			);

			const forward = (await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(forward.edges).toEqual([]);
			expect(forward.pageInfo.startCursor).toBeNull();
			expect(forward.pageInfo.endCursor).toBeNull();

			const backward = (await childFoldersResolver(
				mockAgendaFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(backward.edges).toEqual([]);
		});

		it("sentinel boundary (forward)", async () => {
			const many = Array.from({ length: 11 }, (_, i) => ({
				...mockChildFolders[0],
				id: `x${i}`,
				name: `Folder ${i}`,
			}));

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				many,
			);

			const res = (await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(res.edges).toHaveLength(10);
			expect(res.pageInfo.hasNextPage).toBe(true);
		});

		it("sentinel boundary (backward)", async () => {
			const many = Array.from({ length: 11 }, (_, i) => ({
				...mockChildFolders[0],
				id: `y${i}`,
				name: `Folder ${i}`,
			}));

			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				many,
			);

			const res = (await childFoldersResolver(
				mockAgendaFolder,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(res.edges).toHaveLength(10);
			expect(res.pageInfo.hasPreviousPage).toBe(true);
		});

		it("cursor values", async () => {
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(
				mockChildFolders,
			);

			const res = (await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(res.pageInfo.startCursor).toBeDefined();
			expect(res.pageInfo.endCursor).toBeDefined();
		});

		it("after → hasPreviousPage true", async () => {
			const folderA = mockChildFolders[0];
			const folderB = mockChildFolders[1];
			if (!folderA || !folderB) throw new Error("Mock data not initialized");

			const cursor = createCursor({
				id: folderA.id,
				name: "Folder A",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderB,
			]);

			const res = (await childFoldersResolver(
				mockAgendaFolder,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(res.pageInfo.hasPreviousPage).toBe(true);
		});

		it("before → hasNextPage true", async () => {
			const folderA = mockChildFolders[0];
			const folderB = mockChildFolders[1];
			if (!folderA || !folderB) throw new Error("Mock data not initialized");

			const cursor = createCursor({
				id: folderB.id,
				name: "Folder B",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([
				folderA,
			]);

			const res = (await childFoldersResolver(
				mockAgendaFolder,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			)) as Connection;

			expect(res.pageInfo.hasNextPage).toBe(true);
		});
	});

	describe("Complexity", () => {
		it("computes complexity", () => {
			const type = schema.getType("AgendaFolder") as GraphQLObjectType;
			const field = type.getFields().childFolders;

			if (!field) throw new Error("childFolders field not found");

			type ComplexityFunction = (
				args: Record<string, unknown>,
				childComplexity: unknown,
				multiplier: number,
			) => { multiplier: number };

			interface FieldWithComplexity extends GraphQLField<unknown, unknown> {
				complexity?: ComplexityFunction;
			}

			const fn =
				(field as FieldWithComplexity).complexity ||
				(field.extensions?.complexity as ComplexityFunction | undefined);

			expect(typeof fn).toBe("function");
			if (typeof fn !== "function") return;

			expect(fn({ first: 10 }, {}, 0).multiplier).toBe(10);
			expect(fn({ last: 5 }, {}, 0).multiplier).toBe(5);
			expect(fn({}, {}, 0).multiplier).toBe(1);
		});
	});
});
