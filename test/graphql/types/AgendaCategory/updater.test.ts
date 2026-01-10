import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveUpdater } from "~/src/graphql/types/AgendaCategory/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.updater resolver", () => {
	let ctx: GraphQLContext;
	let mockAgendaCategory: AgendaCategoryType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockAgendaCategory = {
			id: "category-123",
			eventId: "event-123",
			updaterId: "user-456",
		} as AgendaCategoryType;
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unexpected error when associated event is missing", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category's event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is neither superadmin nor org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "regular" }],
			},
		});

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns null when updaterId is null", async () => {
		mockAgendaCategory.updaterId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toBeNull();
	});

	it("returns current user when updaterId matches current user id", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		mockAgendaCategory.updaterId = "user-123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			currentUser,
		);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("throws unexpected error when updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			}) // current user
			.mockResolvedValueOnce(undefined); // updater user missing

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category's updater id that isn't null.",
		);
	});

	it("returns updater user when different from current user", async () => {
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

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("allows access when user is organization administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
		};

		mockAgendaCategory.updaterId = "user-123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			currentUser,
		);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});
});
