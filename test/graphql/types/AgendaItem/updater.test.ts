import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUpdater } from "~/src/graphql/types/AgendaItem/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.updater resolver", () => {
	let ctx: GraphQLContext;
	let mockAgendaItem: AgendaItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockAgendaItem = {
			id: "agenda-item-123",
			folderId: "folder-123",
			updaterId: "user-123",
		} as AgendaItemType;
	});

	it("should throw unauthenticated error if client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unexpected error if agenda folder does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("should throw unauthorized_action if user is not admin and not org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return null if updaterId is null", async () => {
		mockAgendaItem.updaterId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [],
				},
			},
		});

		const result = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if updaterId matches current user id", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [],
				},
			},
		});

		const result = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mockAgendaItem.updaterId = "user-456";

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			}) // current user
			.mockResolvedValueOnce(undefined); // updater not found

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [],
				},
			},
		});

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's updater id that isn't null.",
		);
	});

	it("should return updater user if different from current user", async () => {
		mockAgendaItem.updaterId = "user-456";

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // current user
			.mockResolvedValueOnce(updaterUser); // updater user

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date(),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [],
				},
			},
		});

		const result = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result).toEqual(updaterUser);
	});
});
