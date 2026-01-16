import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUrl } from "~/src/graphql/types/AgendaItem/url";

describe("AgendaItem.url resolver", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "user-1",
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({
							id: "user-1",
							role: "administrator",
						}),
					},
					agendaFoldersTable: {
						findFirst: vi.fn().mockResolvedValue({
							id: "folder-1",
							event: {
								organization: {
									membershipsWhereOrganization: [{ role: "administrator" }],
								},
							},
						}),
					},
					agendaItemUrlTable: {
						findMany: vi.fn(),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("should return urls for the agenda item", async () => {
		const parent: AgendaItemType = {
			id: "agenda-item-1",
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
		).toHaveBeenCalledTimes(1);

		expect(result).toEqual(mockUrls);
	});

	it("should return an empty array when no urls exist", async () => {
		const parent: AgendaItemType = {
			id: "agenda-item-2",
		} as AgendaItemType;

		ctx.drizzleClient.query.agendaItemUrlTable.findMany = vi
			.fn()
			.mockResolvedValue([]);

		const result = await resolveUrl(parent, {}, ctx);

		expect(result).toEqual([]);
	});
});
