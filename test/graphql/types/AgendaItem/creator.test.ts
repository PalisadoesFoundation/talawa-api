import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveCreator } from "~/src/graphql/types/AgendaItem/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/* -------------------------------------------------------------------------- */
/*                            Local typed mock helpers                         */
/* -------------------------------------------------------------------------- */

interface MockAgendaFolder {
	isAgendaItemFolder: true;
	event: {
		organization: {
			membershipsWhereOrganization: Array<{
				role: "administrator" | "member";
			}>;
		};
	};
}

const createMockAgendaFolder = (
	overrides?: Partial<MockAgendaFolder>,
): MockAgendaFolder => ({
	isAgendaItemFolder: true,
	event: {
		organization: {
			membershipsWhereOrganization: [],
		},
	},
	...overrides,
});

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

describe("AgendaItem.creator resolver", () => {
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
			id: "item-123",
			folderId: "folder-123",
			creatorId: "creator-123",
		} as AgendaItemType;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreator(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder() as unknown as Record<string, unknown>,
		);

		await expect(resolveCreator(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("allows access when user is org admin but not system admin", async () => {
		const creatorUser = { id: "creator-123", role: "member" };

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user-123", role: "member" })
			.mockResolvedValueOnce(creatorUser);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder({
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			}) as unknown as Record<string, unknown>,
		);

		const result = await resolveCreator(mockAgendaItem, {}, ctx);
		expect(result).toEqual(creatorUser);
	});

	it("throws unexpected when agenda folder does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveCreator(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is neither system nor org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder({
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "member" }],
					},
				},
			}) as unknown as Record<string, unknown>,
		);

		await expect(resolveCreator(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("returns null when creatorId is null", async () => {
		mockAgendaItem.creatorId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder() as unknown as Record<string, unknown>,
		);

		const result = await resolveCreator(mockAgendaItem, {}, ctx);
		expect(result).toBeNull();
	});

	it("returns current user when creatorId matches current user", async () => {
		mockAgendaItem.creatorId = "user-123";

		const currentUser = { id: "user-123", role: "administrator" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder() as unknown as Record<string, unknown>,
		);

		const result = await resolveCreator(mockAgendaItem, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("throws unexpected when creator user does not exist", async () => {
		mockAgendaItem.creatorId = "creator-456";

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user-123", role: "administrator" })
			.mockResolvedValueOnce(undefined);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder() as unknown as Record<string, unknown>,
		);

		await expect(resolveCreator(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's creator id that isn't null.",
		);
	});

	it("returns creator user when authorized and creator differs from current user", async () => {
		const creatorUser = { id: "creator-123", role: "member" };

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user-123", role: "administrator" })
			.mockResolvedValueOnce(creatorUser);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue(
			createMockAgendaFolder() as unknown as Record<string, unknown>,
		);

		const result = await resolveCreator(mockAgendaItem, {}, ctx);
		expect(result).toEqual(creatorUser);
	});
});
