import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveCreatedAt } from "~/src/graphql/types/AgendaItem/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.createdAt resolver", () => {
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
			name: "Agenda Item",
			folderId: "folder-123",
			createdAt: new Date("2024-01-01T10:00:00Z"),
		} as AgendaItemType;
	});

	it("should throw unauthenticated error if client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreatedAt(mockAgendaItem, {}, ctx)).rejects.toThrow(
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

		await expect(resolveCreatedAt(mockAgendaItem, {}, ctx)).rejects.toThrow(
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

		await expect(resolveCreatedAt(mockAgendaItem, {}, ctx)).rejects.toThrow(
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

		await expect(resolveCreatedAt(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return createdAt when user is system administrator", async () => {
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

		const result = await resolveCreatedAt(mockAgendaItem, {}, ctx);
		expect(result).toEqual(mockAgendaItem.createdAt);
	});

	it("should return createdAt when user is organization administrator", async () => {
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
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveCreatedAt(mockAgendaItem, {}, ctx);
		expect(result).toEqual(mockAgendaItem.createdAt);
	});

	it("should return exact Date instance from parent", async () => {
		const specificDate = new Date("2023-12-31T23:59:59.999Z");
		mockAgendaItem.createdAt = specificDate;

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

		const result = await resolveCreatedAt(mockAgendaItem, {}, ctx);
		expect(result).toBe(specificDate);
		expect(result.getTime()).toBe(specificDate.getTime());
	});
});
