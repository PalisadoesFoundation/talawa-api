import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveOrganization } from "~/src/graphql/types/AgendaCategory/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.organization resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockCategory: AgendaCategoryType = {
		id: "category-1",
		name: "Test Category",
		organizationId: "org-1",
		eventId: "event-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-2",
	} as AgendaCategoryType;

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});

	it("returns organization when authorized and organization exists", async () => {
		const mockOrganization = {
			id: "org-1",
			name: "Test Organization",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			organization: {
				membershipsWhereOrganization: [],
			},
		});

		ctx.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		const result = await resolveOrganization(mockCategory, {}, ctx);
		expect(result).toEqual(mockOrganization);
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			organization: {
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unexpected when event is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is not admin or org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			organization: {
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("throws unexpected when dataloader returns null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			organization: {
				membershipsWhereOrganization: [],
			},
		});

		ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveOrganization(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(logSpy).toHaveBeenCalledWith(
			{
				agendaCategoryId: mockCategory.id,
				organizationId: mockCategory.organizationId,
			},
			"DataLoader returned null for an agenda category's organization id that isn't null",
		);
	});
});
