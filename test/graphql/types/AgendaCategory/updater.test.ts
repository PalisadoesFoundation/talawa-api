import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveUpdater } from "~/src/graphql/types/AgendaCategory/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.updater resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockAgendaCategory: AgendaCategoryType;

	beforeEach(() => {
		const setup = createMockGraphQLContext(true, "user-123");
		ctx = setup.context;
		mocks = setup.mocks;

		mockAgendaCategory = {
			id: "category-123",
			organizationId: "org-123",
			updaterId: "user-456",
		} as AgendaCategoryType;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthorized_action when user is neither admin nor org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [{ role: "member" }],
		});

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("returns null when updaterId is null", async () => {
		mockAgendaCategory.updaterId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toBeNull();
	});

	it("returns current user when updaterId matches current user id", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mockAgendaCategory.updaterId = "user-123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("throws unexpected when updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(undefined);

		await expect(resolveUpdater(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category's updater id that isn't null.",
		);
	});

	it("returns updater user when different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		ctx.dataloaders.user.load = vi.fn().mockResolvedValue(updaterUser);

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("allows access when user is organization administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mockAgendaCategory.updaterId = "user-123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		const result = await resolveUpdater(mockAgendaCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});
});
