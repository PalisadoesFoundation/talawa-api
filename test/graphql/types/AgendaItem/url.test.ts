import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUrl } from "~/src/graphql/types/AgendaItem/url";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.url resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockAgendaItem: AgendaItemType = {
		id: "agenda-item-1",
		name: "Item",
		eventId: "event-1",
		folderId: "folder-1",
		type: "general",
		sequence: 1,
		description: null,
		duration: null,
		categoryId: "category-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-1",
		key: null,
		notes: null,
	};

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
		vi.clearAllMocks();
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		const unauth = createMockGraphQLContext(false, "user-1");

		await expect(
			resolveUrl(mockAgendaItem, {}, unauth.context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);

		expect(
			unauth.mocks.drizzleClient.query.agendaItemUrlTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unexpected when agenda folder does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("throws unexpected when event does not exist on folder", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: undefined,
			} as never,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's event or organization id that isn't null.",
		);
	});

	it("throws unexpected when event exists but organization is missing", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: {
					organization: undefined,
				},
			} as never,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's event or organization id that isn't null.",
		);
	});

	it("throws unauthorized_action when user has non-admin organization membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "regular" }],
					},
				},
			} as never,
		);

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("throws unauthorized_action when user is not admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: {
					id: "event-1",
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		await expect(resolveUrl(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns URLs for system administrator", async () => {
		const mockUrls = [
			{ id: "url-1", agendaItemId: "agenda-item-1", url: "https://a.com" },
			{ id: "url-2", agendaItemId: "agenda-item-1", url: "https://b.com" },
		];

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: {
					id: "event-1",
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		mocks.drizzleClient.query.agendaItemUrlTable.findMany.mockResolvedValueOnce(
			mockUrls as never,
		);

		const result = await resolveUrl(mockAgendaItem, {}, ctx);

		expect(result).toEqual(mockUrls);
	});

	it("returns URLs for organization administrator", async () => {
		const mockUrls = [
			{ id: "url-1", agendaItemId: "agenda-item-1", url: "https://a.com" },
		];

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: {
					id: "event-1",
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			} as never,
		);

		mocks.drizzleClient.query.agendaItemUrlTable.findMany.mockResolvedValueOnce(
			mockUrls as never,
		);

		const result = await resolveUrl(mockAgendaItem, {}, ctx);

		expect(result).toEqual(mockUrls);
	});
});
