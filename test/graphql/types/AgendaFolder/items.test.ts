import { Buffer } from "node:buffer";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import {
	itemsArgumentsSchema,
	resolveItems,
} from "~/src/graphql/types/AgendaFolder/items";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * IMPORTANT:
 * Cursor MUST match agendaItemsTableInsertSchema-derived cursorSchema
 */
function encodeValidCursor() {
	return Buffer.from(
		JSON.stringify({
			id: "550e8400-e29b-41d4-a716-446655440000",
			sequence: 1,
		}),
	).toString("base64url");
}

describe("itemsArgumentsSchema", () => {
	it("parses valid forward pagination cursor", () => {
		const result = itemsArgumentsSchema.safeParse({
			first: 5,
			after: encodeValidCursor(),
		});

		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data).toEqual({
				cursor: {
					id: expect.any(String),
					sequence: 1,
				},
				isInversed: false,
				limit: 6,
			});
		}
	});

	it("parses valid backward pagination cursor", () => {
		const result = itemsArgumentsSchema.safeParse({
			last: 3,
			before: encodeValidCursor(),
		});

		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data).toEqual({
				cursor: {
					id: expect.any(String),
					sequence: 1,
				},
				isInversed: true,
				limit: 4,
			});
		}
	});

	it("fails with custom issue for invalid cursor", () => {
		const result = itemsArgumentsSchema.safeParse({
			first: 2,
			after: "not-a-valid-cursor",
		});

		expect(result.success).toBe(false);

		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.message === "Not a valid cursor.",
			);
			expect(issue).toBeDefined();
			expect(issue?.path).toEqual(["after"]);
		}
	});
});

describe("AgendaFolder.items resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let parent: AgendaFolderType;

	beforeEach(() => {
		const mock = createMockGraphQLContext(true, "user-1");
		ctx = mock.context;
		mocks = mock.mocks;

		parent = {
			id: "folder-1",
			name: "Folder",
			description: null,
			organizationId: "org-1",
			eventId: "event-1",
			isAgendaItemFolder: true,
			parentFolderId: null,
			sequence: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "user-1",
			updaterId: "user-1",
			isDefaultFolder: false,
		} as AgendaFolderType;
	});

	it("throws invalid_arguments when cursor is invalid", async () => {
		await expect(
			resolveItems(parent, { first: 2, after: "bad-cursor" }, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: expect.any(Array),
				},
			}),
		);
	});

	it("returns items without cursor (forward)", async () => {
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([
			{ id: "item-1", name: "Alpha" },
			{ id: "item-2", name: "Bravo" },
		] as never);

		const result = await resolveItems(parent, { first: 2 }, ctx);

		expect(result.edges).toHaveLength(2);
		expect(result.edges[0]?.node?.name).toBe("Alpha");
		expect(result.pageInfo.hasNextPage).toBe(false);

		expect(
			mocks.drizzleClient.query.agendaItemsTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 3,
			}),
		);
	});

	it("throws arguments_associated_resources_not_found when cursor exists but no rows returned", async () => {
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([]);
		mocks.drizzleClient.query.agendaItemsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveItems(parent, { first: 2, after: encodeValidCursor() }, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["after"] }],
				},
			}),
		);
	});

	it("supports inverse pagination (before / last)", async () => {
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([
			{ id: "item-3", name: "Charlie" },
			{ id: "item-2", name: "Bravo" },
		] as never);

		const result = await resolveItems(
			parent,
			{ last: 2, before: encodeValidCursor() },
			ctx,
		);

		expect(result.edges).toHaveLength(2);
		expect(result.edges[0]?.node?.name).toBe("Bravo");
		expect(result.pageInfo.hasPreviousPage).toBe(false);
		expect(result.pageInfo.hasNextPage).toBe(true);
	});

	it("returns hasNextPage true when more items exist", async () => {
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([
			{ id: "item-1", name: "Alpha" },
			{ id: "item-2", name: "Bravo" },
			{ id: "item-3", name: "Charlie" },
		] as never);

		const result = await resolveItems(parent, { first: 2 }, ctx);

		expect(result.edges).toHaveLength(2);
		expect(result.pageInfo.hasNextPage).toBe(true);
	});

	it("returns empty connection when no items and no cursor", async () => {
		mocks.drizzleClient.query.agendaItemsTable.findMany.mockResolvedValue([]);

		const result = await resolveItems(parent, { first: 5 }, ctx);

		expect(result.edges).toHaveLength(0);
		expect(result.pageInfo.hasNextPage).toBe(false);
	});
});
