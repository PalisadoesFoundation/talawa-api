import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveUpdater } from "~/src/graphql/types/AgendaFolder/updater";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/AgendaFolder/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaFolder Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockAgendaFolder: AgendaFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockAgendaFolder = {
			id: "agendaFolder-123",
			eventId: "event-123",
			updaterId: "user-123",
		} as AgendaFolderType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		ctx.currentClient.isAuthenticated = true;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unexpected error if event is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("should throw unauthorized_action error if user is not an administrator and not an organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unauthorized_action error if user is not an administrator and organization membership is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if updaterId is null", async () => {
		mockAgendaFolder.updaterId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdater(mockAgendaFolder, {}, ctx);
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
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdater(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mockAgendaFolder.updaterId = "user-456";

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			}) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: updater does not exist

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(resolveUpdater(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's updater id that isn't null.",
		);
	});

	it("should return updater user if different from current user", async () => {
		mockAgendaFolder.updaterId = "user-456";

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // First call: current user
			.mockResolvedValueOnce(updaterUser); // Second call: updater user

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdater(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should allow access if user is a superadmin (role: administrator)", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [], // No organization membership
			},
		});

		await expect(
			resolveUpdater(mockAgendaFolder, {}, ctx),
		).resolves.toBeDefined();
	});

	it("should allow access if user is organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(
			resolveUpdater(mockAgendaFolder, {}, ctx),
		).resolves.toBeDefined();
	});
});
