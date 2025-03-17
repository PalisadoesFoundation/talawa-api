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

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
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

	it("should throw unexpected error if updater user does not exist", async () => {
		// Arrange:
		// 1. Mock the current user as authenticated and authorized.
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

		// 2. Set the updater ID in the mockAgendaItem to a different user.
		mockAgendaItem.updaterId = "user-456";

		// Act & Assert: Call the function and assert the correct error is thrown
		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		// Verify error logging was called
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

		// Should return null if updaterId is null in AgendaItem
		mockAgendaItem.updaterId = null;
		const result_1 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_1).toBeNull();

		// Should return currentUser if updaterId==currentUser.id  in AgendaItem
		mockAgendaItem.updaterId = "user-123";
		const result_2 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_2).toEqual({
			id: "user-123",
			role: "administrator",
		});

		// updaterId exist but updaterId==currentUser.id
		mockAgendaItem.updaterId = "user-456";
		const result_3 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_3).toEqual({
			id: "user-123",
			role: "administrator",
		});
	});

	it("should throw unexpected error if updater is not current user and updater does not exist", async () => {
		// Arrange:
		// 1. Mock the current user as authenticated.
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "administrator",
		});

		// 2. Have the second user lookup return 'undefined', simulating a missing updater.
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		); // This simulates the missing "updater"

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		// Act: Set the updater ID to a different user
		mockAgendaItem.updaterId = "user-456";

		// Assert: Expect the "unexpected" error to be thrown.
		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's updater id that isn't null.",
		);
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
