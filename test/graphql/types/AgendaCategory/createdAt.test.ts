import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategories/AgendaCategories";
import { resolveCreatedAt } from "~/src/graphql/types/AgendaCategories/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/AgendaCategories/AgendaCategories";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

describe("AgendaCategory.createdAt resolver", () => {
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
			name: "Test Category",
			eventId: "event-123",
			createdAt: new Date("2024-01-01T10:00:00.000Z"),
		} as AgendaCategoryType;
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unexpected error when associated event is missing", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const logSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category event id that isn't null.",
		);
	});

	it("throws unauthorized_action when user is neither superadmin nor org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
		});

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			startAt: new Date(),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "regular" }],
			},
		});

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("allows access when user is a super administrator", async () => {
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

		const result = await resolveCreatedAt(mockAgendaCategory, {}, ctx);
		expect(result).toBe(mockAgendaCategory.createdAt);
	});

	it("allows access when user is an organization administrator", async () => {
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

		const result = await resolveCreatedAt(mockAgendaCategory, {}, ctx);
		expect(result).toBe(mockAgendaCategory.createdAt);
	});

	it("returns the exact createdAt value from parent", async () => {
		const specificDate = new Date("2023-12-25T15:30:45.123Z");

		const categoryWithSpecificDate = {
			...mockAgendaCategory,
			createdAt: specificDate,
		};

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

		const result = await resolveCreatedAt(categoryWithSpecificDate, {}, ctx);

		expect(result).toBe(specificDate);
		expect(result.getTime()).toBe(specificDate.getTime());
	});
});
