import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveCreator } from "~/src/graphql/types/AgendaFolder/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaFolder.creator resolver", () => {
	let ctx: GraphQLContext;
	let mockAgendaFolder: AgendaFolderType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockAgendaFolder = {
			id: "folder-123",
			name: "Test Folder",
			description: null,
			organizationId: "org-123",
			eventId: "event-123",
			sequence: 1,
			isDefaultFolder: false,
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: new Date("2024-01-02T00:00:00.000Z"),
			creatorId: "creator-123",
			updaterId: "updater-123",
		};
	});

	it("should throw unauthenticated error if client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unexpected error if event does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("should throw unauthorized_action if user is not admin and not org admin", async () => {
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

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return null if creatorId is null", async () => {
		mockAgendaFolder.creatorId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveCreator(mockAgendaFolder, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if creatorId matches current user id", async () => {
		mockAgendaFolder.creatorId = "user-123";

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
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveCreator(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unexpected error if creator user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			})
			.mockResolvedValueOnce(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's creator id that isn't null.",
		);
	});

	it("should return creator user when different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const creatorUser = {
			id: "creator-123",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(creatorUser);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveCreator(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(creatorUser);
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

		const creatorUser = {
			id: "creator-123",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			creatorUser,
		);

		const result = await resolveCreator(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(creatorUser);
	});

	it("should propagate database errors", async () => {
		const dbError = new Error("Database failure");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(resolveCreator(mockAgendaFolder, {}, ctx)).rejects.toThrow(
			dbError,
		);
	});
});
