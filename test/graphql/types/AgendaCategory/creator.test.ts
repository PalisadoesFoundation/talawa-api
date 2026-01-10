import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaCategory as AgendaCategoryType } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import { resolveCreator } from "~/src/graphql/types/AgendaCategory/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaCategory.creator resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockCategory: AgendaCategoryType;

	beforeEach(() => {
		const setup = createMockGraphQLContext(true, "user-123");
		ctx = setup.context;
		mocks = setup.mocks;

		mockCategory = {
			id: "category-123",
			name: "General",
			eventId: "event-123",
			organizationId: "org-123",
			creatorId: "creator-123",
		} as AgendaCategoryType;

		ctx.dataloaders.user = {
			load: vi.fn(),
		} as any;
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveCreator(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthenticated when current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreator(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("throws unauthorized_action when user is not admin and not org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{ role: "member" },
			],
		});

		await expect(resolveCreator(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("returns null when creatorId is null", async () => {
		mockCategory.creatorId = null;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveCreator(mockCategory, {}, ctx);
		expect(result).toBeNull();
	});

	it("returns current user when creatorId matches current user", async () => {
		mockCategory.creatorId = "user-123";

		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(currentUser);

		const result = await resolveCreator(mockCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("throws unexpected when creator user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		(ctx.dataloaders.user.load as any).mockResolvedValue(undefined);

		await expect(resolveCreator(mockCategory, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda category's creator id that isn't null.",
		);
	});

	it("returns creator user when authorized", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		const creatorUser = {
			id: "creator-123",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(currentUser);
		(ctx.dataloaders.user.load as any).mockResolvedValue(creatorUser);

		const result = await resolveCreator(mockCategory, {}, ctx);
		expect(result).toEqual(creatorUser);
	});
});
