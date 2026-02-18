import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaFolder as AgendaFolderType } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { resolveUpdater } from "~/src/graphql/types/AgendaFolder/updater";
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

	it("should validate membershipsWhereOrganization filters by current user ID", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		// Mock implementation to capture and validate the where clause
		let whereClauseValidated = false;
		mocks.drizzleClient.query.eventsTable.findFirst.mockImplementation(
			async (args: unknown = {}) => {
				const withClause = (args as Record<string, unknown>).with as Record<
					string,
					unknown
				>;

				// Verify that membershipsWhereOrganization where clause exists
				const organizationWith = (
					withClause?.organization as Record<string, unknown>
				)?.with as Record<string, unknown>;
				const membership = organizationWith?.membershipsWhereOrganization as {
					where: (
						fields: Record<string, unknown>,
						operators: Record<string, unknown>,
					) => unknown;
				};
				expect(membership).toBeDefined();
				expect(membership.where).toBeDefined();

				// Mock the operators object that Drizzle provides
				const mockOperators = {
					eq: (_field: unknown, value: unknown) => {
						// Verify the where clause is filtering by memberId === currentUserId
						expect(value).toBe("user-123");
						whereClauseValidated = true;
						return true;
					},
				};

				// Call the where clause with mock fields and operators
				const mockFields = { memberId: "user-123" };
				membership.where(mockFields, mockOperators);

				return {
					startAt: new Date(),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				};
			},
		);

		const result = await resolveUpdater(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(currentUser);
		expect(whereClauseValidated).toBe(true);
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
				membershipsWhereOrganization: [], // No organization membership
			},
		});

		const result = await resolveUpdater(mockAgendaFolder, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should allow access if user is organization administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
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
});
