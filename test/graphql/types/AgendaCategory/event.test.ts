import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveEvent } from "~/src/graphql/types/AgendaCategory/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.event resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const parent: AgendaCategory = {
		id: "category-1",
		name: "Category",
		description: null,
		eventId: "event-1",
		organizationId: "org-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		creatorId: "user-1",
		updaterId: "user-1",
		isDefaultCategory: false,
	};

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveEvent(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-1",
			attachmentsWhereEvent: [],
			organization: { membershipsWhereOrganization: [] },
		} as never);

		await expect(resolveEvent(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unexpected when event is missing (data corruption)", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveEvent(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is not admin and not org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-1",
			role: "member",
		} as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-1",
			attachmentsWhereEvent: [],
			organization: {
				membershipsWhereOrganization: [{ role: "member" }],
			},
		} as never);

		await expect(resolveEvent(parent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("allows access for super administrator", async () => {
		const event = {
			id: "event-1",
			attachmentsWhereEvent: [{ id: "att-1" }],
			organization: { membershipsWhereOrganization: [] },
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-1",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			event as never,
		);

		const result = await resolveEvent(parent, {}, ctx);

		expect(result).toEqual({
			...event,
			attachments: event.attachmentsWhereEvent,
		});
	});

	it("allows access for organization administrator", async () => {
		const event = {
			id: "event-1",
			attachmentsWhereEvent: [{ id: "att-1" }],
			organization: {
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-1",
			role: "member",
		} as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			event as never,
		);

		const result = await resolveEvent(parent, {}, ctx);

		expect(result).toEqual({
			...event,
			attachments: event.attachmentsWhereEvent,
		});
	});
});
