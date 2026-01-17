import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveFolder } from "~/src/graphql/types/AgendaItem/folder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

describe("AgendaItem.folder resolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockParent: AgendaItem = {
		id: "item-1",
		name: "Agenda Item",
		type: "general",
		folderId: "folder-1",
		eventId: "event-1",
		sequence: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-1",
		description: null,
		duration: null,
		key: null,
		categoryId: "category-1",
		notes: null,
	};

	it("throws unauthenticated error when not authenticated", async () => {
		const { context } = createMockGraphQLContext(false, "user-1");

		await expect(resolveFolder(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when user not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: { organization: { membershipsWhereOrganization: [] } },
			} as never,
		);

		await expect(resolveFolder(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthorized error when user lacks admin access", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-1",
			role: "user",
		} as never);
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				id: "folder-1",
				event: { organization: { membershipsWhereOrganization: [] } },
			} as never,
		);

		await expect(resolveFolder(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns agenda folder when it exists", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		const mockFolder = {
			id: "folder-1",
			name: "Folder",
			eventId: "event-1",
		};

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			mockFolder as never,
		);

		const result = await resolveFolder(mockParent, {}, context);

		expect(result).toEqual(mockFolder);
		expect(
			mocks.drizzleClient.query.agendaFoldersTable.findFirst,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.any(Function),
			}),
		);
	});

	it("throws unexpected error when agenda folder does not exist", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-1");

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveFolder(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);

		expect(context.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});
});
