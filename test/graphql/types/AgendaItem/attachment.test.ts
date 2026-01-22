import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveAttachments } from "~/src/graphql/types/AgendaItem/attachment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.attachments resolver", () => {
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
			resolveAttachments(mockAgendaItem, {}, unauth.context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);

		expect(
			unauth.mocks.drizzleClient.query.agendaItemAttachmentsTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveAttachments(mockAgendaItem, {}, ctx)).rejects.toThrow(
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

		await expect(resolveAttachments(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("returns empty array when no attachments exist", async () => {
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

		mocks.drizzleClient.query.agendaItemAttachmentsTable.findMany.mockResolvedValueOnce(
			[] as never,
		);

		const result = await resolveAttachments(mockAgendaItem, {}, ctx);

		expect(result).toEqual([]);
	});

	it("throws unauthorized_action when user is org member but not org admin", async () => {
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
						membershipsWhereOrganization: [{ role: "member" }],
					},
				},
			} as never,
		);

		await expect(resolveAttachments(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
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

		await expect(resolveAttachments(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's event id that isn't null.",
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

		await expect(resolveAttachments(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns attachments for system administrator", async () => {
		const mockAttachments = [
			{ id: "att-1", agendaItemId: "agenda-item-1" },
			{ id: "att-2", agendaItemId: "agenda-item-1" },
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

		mocks.drizzleClient.query.agendaItemAttachmentsTable.findMany.mockResolvedValueOnce(
			mockAttachments as never,
		);

		const result = await resolveAttachments(mockAgendaItem, {}, ctx);

		expect(result).toEqual(mockAttachments);
	});

	it("returns attachments for organization administrator", async () => {
		const mockAttachments = [{ id: "att-1", agendaItemId: "agenda-item-1" }];

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

		mocks.drizzleClient.query.agendaItemAttachmentsTable.findMany.mockResolvedValueOnce(
			mockAttachments as never,
		);

		const result = await resolveAttachments(mockAgendaItem, {}, ctx);

		expect(result).toEqual(mockAttachments);
	});
});
