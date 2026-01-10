import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveUpdatedAt } from "~/src/graphql/types/AgendaCategory/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.updatedAt resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const mockCategory: AgendaCategoryType = {
		id: "category-1",
		name: "Category",
		eventId: "event-1",
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-02T00:00:00Z"),
		creatorId: "user-1",
		updaterId: "user-2",
	} as AgendaCategoryType;

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdatedAt(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(resolveUpdatedAt(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
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

		await expect(resolveUpdatedAt(mockCategory, {}, ctx)).rejects.toThrow(
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
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(resolveUpdatedAt(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns updatedAt for super administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await resolveUpdatedAt(mockCategory, {}, ctx);
		expect(result).toEqual(mockCategory.updatedAt);
	});

	it("returns updatedAt for organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await resolveUpdatedAt(mockCategory, {}, ctx);
		expect(result).toEqual(mockCategory.updatedAt);
	});
});
