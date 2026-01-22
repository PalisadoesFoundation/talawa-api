import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUpdatedAt } from "~/src/graphql/types/AgendaItem/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

describe("AgendaItem.updatedAt resolver", () => {
	const mockParent: AgendaItem = {
		id: "item-1",
		name: "Agenda Item",
		folderId: "folder-1",
		eventId: "event-1",
		type: "general",
		sequence: 1,
		key: null,
		notes: null,
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		updatedAt: new Date("2024-01-02T00:00:00.000Z"),
		description: null,
		duration: null,
		categoryId: "category-1",
		creatorId: "creator-1",
		updaterId: "updater-1",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		const { context } = createMockGraphQLContext(false);

		await expect(resolveUpdatedAt(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveUpdatedAt(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unexpected when agenda folder is missing", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logSpy = vi.spyOn(context.log, "error");

		await expect(resolveUpdatedAt(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is not admin", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				isAgendaItemFolder: true,
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		await expect(resolveUpdatedAt(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns updatedAt for super administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "admin-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				isAgendaItemFolder: true,
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		const result = await resolveUpdatedAt(mockParent, {}, context);

		expect(result).toEqual(mockParent.updatedAt);
	});

		it("throws unexpected when agenda folder event is missing", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-1");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				id: "user-1",
				role: "administrator",
			} as never);

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce({
				id: "folder-1",
				isAgendaItemFolder: true,
				event: undefined,
			} as never);

			const logSpy = vi.spyOn(context.log, "error");

			await expect(resolveUpdatedAt(mockParent, {}, context)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(logSpy).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an agenda item's event id that isn't null.",
			);
		});

	it("returns updatedAt for organization administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				isAgendaItemFolder: true,
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			} as never,
		);

		const result = await resolveUpdatedAt(mockParent, {}, context);

		expect(result).toEqual(mockParent.updatedAt);
	});
});
