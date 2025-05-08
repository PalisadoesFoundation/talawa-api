import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreatedAt } from "~/src/graphql/types/VolunteerGroup/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mockVolunteerGroup = {
	createdAt: new Date("2025-05-05T20:26:44.107Z"),
	creatorId: "creator123",
	eventId: "event123",
	id: "pledge123",
	leaderId: "leader123",
	maxVolunteerCount: 10,
	name: "Group 1",
	updatedAt: new Date("2025-05-05T20:26:44.107Z"),
	updaterId: "user123",
};

describe("VolunteerGroup.createdAt resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user456",
		);
		ctx = context;
		mocks = newMocks;
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated or not found", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);

		await expect(
			resolveCreatedAt(mockVolunteerGroup, {}, unauthenticatedCtx),
		).rejects.toThrow(TalawaGraphQLError);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreatedAt(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws an error if event does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveCreatedAt(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	test("throws an error if user does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveCreatedAt(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	test("throws an unauthorized error if user is not administrator or member", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			organizationMembershipsWhereMember: {
				role: undefined,
			},
		});

		await expect(resolveCreatedAt(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns createdAt Date", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user4567",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});

		const result = await resolveCreatedAt(mockVolunteerGroup, {}, ctx);
		expect(result).toEqual(new Date("2025-05-05T20:26:44.107Z"));
	});
});
