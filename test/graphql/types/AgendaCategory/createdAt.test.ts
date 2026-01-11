import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveCreatedAt } from "~/src/graphql/types/AgendaCategory/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.createdAt resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockAgendaCategory: AgendaCategoryType;

	beforeEach(() => {
		const setup = createMockGraphQLContext(true, "user-123");
		ctx = setup.context;
		mocks = setup.mocks;

		mockAgendaCategory = {
			id: "category-123",
			name: "Test Category",
			organizationId: "org-123",
			createdAt: new Date("2024-01-01T10:00:00.000Z"),
		} as AgendaCategoryType;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthorized_action when user is neither admin nor org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [{ role: "member" }],
		});

		await expect(resolveCreatedAt(mockAgendaCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("allows access when user is a super administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveCreatedAt(mockAgendaCategory, {}, ctx);
		expect(result).toBe(mockAgendaCategory.createdAt);
	});

	it("allows access when user is an organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
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
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveCreatedAt(categoryWithSpecificDate, {}, ctx);

		expect(result).toBe(specificDate);
		expect(result.getTime()).toBe(specificDate.getTime());
	});
});
