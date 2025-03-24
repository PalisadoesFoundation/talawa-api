import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUpdater } from "~/src/graphql/types/AgendaItem/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockAgendaItem: AgendaItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	beforeEach(() => {
		mockAgendaItem = {
			id: "agendaItem-123",
			folderId: "folder-123",
			updaterId: "user-123",
		} as AgendaItemType;
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should throw unauthenticated error if user is not logged in or not found", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);

		ctx.currentClient.isAuthenticated = true;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized_action error if user is not an administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unexpected error if agenda folder is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			}) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: updater does not exist

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		// the updater ID in the mockAgendaItem to a different user.
		mockAgendaItem.updaterId = "user-456";

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's updater id that isn't null.",
		);
	});

	it("should resolve successfully if user is an administrator and part of the organization", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockAgendaItem, {}, ctx),
		).resolves.toBeDefined();

		mockAgendaItem.updaterId = null;
		const result_1 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_1).toBeNull();
	});

	it("should test the innermost where clause in query", async () => {
		// Mock the return value of usersTable.findFirst
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});

		// Mock the return value of agendaFoldersTable.findFirst
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockAgendaItem, {}, ctx),
		).resolves.toBeDefined();
	});
});
