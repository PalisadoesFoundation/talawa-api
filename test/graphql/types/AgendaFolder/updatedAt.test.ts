import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveUpdatedAt } from "~/src/graphql/types/AgendaFolder/updatedAt";

type MockHelpers = ReturnType<typeof createMockGraphQLContext>["mocks"];

describe("AgendaFolder.updatedAt - unit tests", () => {
	let ctx: GraphQLContext;
	let mocks: MockHelpers;
	let parent: AgendaFolderType;

	beforeEach(() => {
		const created = createMockGraphQLContext(true, "user-123");
		ctx = created.context;
		mocks = created.mocks;

		parent = {
			id: "folder-1",
			name: "My Folder",
			eventId: "event-1",
			organizationId: "org-1",
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: new Date("2024-01-02T00:00:00.000Z"),
			creatorId: "creator-1",
			updaterId: "updater-1",
			parentFolderId: null,
			isAgendaItemFolder: true,
		} as AgendaFolderType;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);
		await expect(resolveUpdatedAt(parent, {}, unauthCtx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: parent.eventId,
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveUpdatedAt(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);

		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
	});

	it("logs error and throws unexpected when event not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce(undefined);

		const spy = vi.fn();
		ctx.log = { ...ctx.log, error: spy };

		await expect(resolveUpdatedAt(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(spy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user has no org membership and is not admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: parent.eventId,
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveUpdatedAt(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("throws unauthorized_action when user has membership but role is member", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: parent.eventId,
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(resolveUpdatedAt(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("returns updatedAt when user is a system administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-1",
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: parent.eventId,
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveUpdatedAt(parent, {}, ctx);
		expect(result).toEqual(parent.updatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});

	it("returns updatedAt when user is organization administrator via membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: parent.eventId,
			startAt: new Date().toISOString(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdatedAt(parent, {}, ctx);
		expect(result).toEqual(parent.updatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});
});
