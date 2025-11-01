import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { DefaultGraphQLConnection } from "~/src/utilities/defaultGraphQLConnection";

// Helper to build a cursor like the resolver does
function buildCursor(input: { id: string; name: string }) {
	return Buffer.from(JSON.stringify(input)).toString("base64url");
}

type AgendaItemRow = typeof agendaItemsTable.$inferSelect;

type ItemsResolver = GraphQLFieldResolver<
	AgendaFolderType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("AgendaFolder.items connection resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let agendaFolder: AgendaFolderType;
	let itemsResolver: ItemsResolver;
	const info = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const agendaFolderType = schema.getType(
			"AgendaFolder",
		) as GraphQLObjectType;
		const field = agendaFolderType.getFields().items;
		if (!field || !field.resolve) {
			throw new Error("items resolver not found on AgendaFolder type");
		}
		itemsResolver = field.resolve as ItemsResolver;
	});

	beforeEach(() => {
		const created = createMockGraphQLContext(true, "user-1");
		ctx = created.context;
		mocks = created.mocks;
		agendaFolder = {
			id: "folder-1",
			isAgendaItemFolder: true,
			name: "Root",
		} as AgendaFolderType;

		// reset relevant mocks
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockReset();
	});

	describe("argument validation", () => {
		it("throws invalid_arguments when neither first nor last is provided", async () => {
			await expect(itemsResolver(agendaFolder, {}, ctx, info)).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["first"],
								message: expect.stringContaining("first"),
							}),
						]),
					}),
				}),
			);
		});

		it("throws invalid_arguments when both first and last are provided", async () => {
			await expect(
				itemsResolver(agendaFolder, { first: 2, last: 2 }, ctx, info),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["last"],
								message: expect.stringContaining("last"),
							}),
						]),
					}),
				}),
			);
		});

		it("throws invalid_arguments when cursor cannot be parsed (after with first)", async () => {
			await expect(
				itemsResolver(
					agendaFolder,
					{ first: 2, after: "not-a-base64url" },
					ctx,
					info,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: expect.stringContaining("cursor"),
							}),
						]),
					}),
				}),
			);
		});
	});

	describe("forward pagination (first/after)", () => {
		it("returns edges and pageInfo without next/previous when no cursor and fewer than limit", async () => {
			// limit = first + 1 = 3; returning fewer than limit
			const rows: AgendaItemRow[] = [
				{ id: "i1", name: "A" } as AgendaItemRow,
				{ id: "i2", name: "B" } as AgendaItemRow,
			];
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue(
				rows,
			);

			const result = (await itemsResolver(
				agendaFolder,
				{ first: 2 },
				ctx,
				info,
			)) as DefaultGraphQLConnection<AgendaItemRow>;

			expect(
				mocks.drizzleClient.query.agendaItemsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 3,
					orderBy: expect.any(Array),
					where: expect.anything(),
				}),
			);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node).toMatchObject({ id: "i1", name: "A" });
			expect(result.edges[1]?.node).toMatchObject({ id: "i2", name: "B" });
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeTruthy();
			expect(result.pageInfo.endCursor).toBeTruthy();
		});

		it("throws arguments_associated_resources_not_found when cursor provided but no rows returned", async () => {
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([]);

			const cursor = buildCursor({ id: "i1", name: "A" });
			await expect(
				itemsResolver(agendaFolder, { first: 2, after: cursor }, ctx, info),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [],
					},
				}),
			);
		});

		it("sets hasNextPage=true and pops extra node when result length equals limit", async () => {
			// limit = 3; return exactly 3 -> will pop to edges length 2
			const rows: AgendaItemRow[] = [
				{ id: "i1", name: "A" } as AgendaItemRow,
				{ id: "i2", name: "B" } as AgendaItemRow,
				{ id: "i3", name: "C" } as AgendaItemRow,
			];
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue(
				rows,
			);

			const cursor = buildCursor({ id: "i0", name: "@" });
			const result = (await itemsResolver(
				agendaFolder,
				{ first: 2, after: cursor },
				ctx,
				info,
			)) as DefaultGraphQLConnection<AgendaItemRow>;

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasNextPage).toBe(true);
			expect(result.pageInfo.hasPreviousPage).toBe(true); // cursor was provided
		});
	});

	describe("inverse pagination (last/before)", () => {
		it("returns reversed edges and pageInfo without next/previous when no cursor and fewer than limit", async () => {
			// limit = last + 1 = 3
			const rows: AgendaItemRow[] = [
				{ id: "i1", name: "A" } as AgendaItemRow,
				{ id: "i2", name: "B" } as AgendaItemRow,
			];
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue(
				rows,
			);

			const res = (await itemsResolver(
				agendaFolder,
				{ last: 2 },
				ctx,
				info,
			)) as DefaultGraphQLConnection<AgendaItemRow>;

			// Edges should be reversed per transformToDefaultGraphQLConnection
			expect(res.edges.map((e) => e.node.id)).toEqual(["i2", "i1"]);
			expect(res.pageInfo.hasPreviousPage).toBe(false);
			expect(res.pageInfo.hasNextPage).toBe(false);
		});

		it("throws arguments_associated_resources_not_found when cursor provided but no rows returned (before)", async () => {
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([]);
			const cursor = buildCursor({ id: "i9", name: "Z" });
			await expect(
				itemsResolver(agendaFolder, { last: 2, before: cursor }, ctx, info),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [],
					},
				}),
			);
		});

		it("sets hasPreviousPage=true and pops extra node when result length equals limit (inverse)", async () => {
			const rows: AgendaItemRow[] = [
				{ id: "i4", name: "D" } as AgendaItemRow,
				{ id: "i5", name: "E" } as AgendaItemRow,
				{ id: "i6", name: "F" } as AgendaItemRow,
			];
			mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue(
				rows,
			);

			const cursor = buildCursor({ id: "i7", name: "G" });
			const res = (await itemsResolver(
				agendaFolder,
				{ last: 2, before: cursor },
				ctx,
				info,
			)) as DefaultGraphQLConnection<AgendaItemRow>;

			expect(res.edges).toHaveLength(2);
			expect(res.pageInfo.hasPreviousPage).toBe(true);
			expect(res.pageInfo.hasNextPage).toBe(true); // cursor was provided
		});
	});
});
