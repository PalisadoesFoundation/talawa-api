import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUrl } from "~/src/graphql/types/AgendaItem/url";

describe("AgendaItem.url resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;

		// Set up default mocks for URL resolver
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-1",
			role: "administrator",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			id: "folder-1",
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		const parent: AgendaItemType = {
			id: "agenda-item-1",
			folderId: "folder-1",
		} as AgendaItemType;

		await expect(resolveUrl(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthenticated when user does not exist", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);

		const parent: AgendaItemType = {
			id: "agenda-item-1",
			folderId: "folder-1",
		} as AgendaItemType;

		await expect(resolveUrl(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unexpected when agenda folder does not exist", async () => {
		ctx.drizzleClient.query.agendaFoldersTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);

		const parent: AgendaItemType = {
			id: "agenda-item-1",
			folderId: "missing-folder",
		} as AgendaItemType;

		await expect(resolveUrl(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});

		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("throws unauthorized_action when user is not an administrator", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi.fn().mockResolvedValue({
			id: "user-1",
			role: "regular",
		});

		ctx.drizzleClient.query.agendaFoldersTable.findFirst = vi
			.fn()
			.mockResolvedValue({
				id: "folder-1",
				event: {
					organization: {
						membershipsWhereOrganization: [
							{ role: "regular" }, // not admin
						],
					},
				},
			});

		const parent: AgendaItemType = {
			id: "agenda-item-1",
			folderId: "folder-1",
		} as AgendaItemType;

		await expect(resolveUrl(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("should return urls for the agenda item", async () => {
		const parent: AgendaItemType = {
			id: "agenda-item-1",
			folderId: "folder-1",
		} as AgendaItemType;

		const mockUrls = [
			{
				id: "url-1",
				agendaItemId: "agenda-item-1",
				agendaItemURL: "https://example.com/1",
			},
			{
				id: "url-2",
				agendaItemId: "agenda-item-1",
				agendaItemURL: "https://example.com/2",
			},
		];

		ctx.drizzleClient.query.agendaItemUrlTable.findMany = vi
			.fn()
			.mockResolvedValue(mockUrls);

		const result = await resolveUrl(parent, {}, ctx);

		expect(
			ctx.drizzleClient.query.agendaItemUrlTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.anything(),
			}),
		);

		expect(result).toEqual(mockUrls);
	});

	it("should return an empty array when no urls exist", async () => {
		const parent: AgendaItemType = {
			id: "agenda-item-2",
			folderId: "folder-1",
		} as AgendaItemType;

		ctx.drizzleClient.query.agendaItemUrlTable.findMany = vi
			.fn()
			.mockResolvedValue([]);

		const result = await resolveUrl(parent, {}, ctx);

		expect(result).toEqual([]);
	});
});
