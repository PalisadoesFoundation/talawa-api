import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveCategory } from "~/src/graphql/types/AgendaItem/agendaCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.category resolver (resolveCategory)", () => {
	const baseAgendaItem: AgendaItemType = {
		id: "agenda-item-1",
		name: "Agenda Item",
		categoryId: "category-1",
		folderId: "folder-1",
		eventId: "event-1",
		type: "general",
		sequence: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-1",
		key: null,
		notes: null,
		description: null,
		duration: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		const { context } = createMockGraphQLContext(false);

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unexpected when agenda category does not exist", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "admin-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logSpy = vi.spyOn(context.log, "error");

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category id that isn't null.",
		);
	});

	it("throws unexpected when agenda folder or event is missing", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "admin-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			{ id: "category-1", name: "Category" } as never,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logSpy = vi.spyOn(context.log, "error");

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder or event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is not admin", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			{ id: "category-1", name: "Category" } as never,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns agenda category for system administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "admin-1");

		const mockCategory = {
			id: "category-1",
			name: "Category",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			mockCategory as never,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		const result = await resolveCategory(baseAgendaItem, {}, context);

		expect(result).toBe(mockCategory);
	});

	it("returns agenda category for organization administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		const mockCategory = {
			id: "category-1",
			name: "Category",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "regular",
		} as never);

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			mockCategory as never,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			} as never,
		);

		const result = await resolveCategory(baseAgendaItem, {}, context);

		expect(result).toBe(mockCategory);
	});
});
