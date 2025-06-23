import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveEvent } from "~/src/graphql/types/VolunteerGroup/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mockVolunteerGroup = {
	createdAt: new Date(),
	creatorId: "creator123",
	eventId: "event123",
	id: "pledge123",
	leaderId: "leader123",
	maxVolunteerCount: 10,
	name: "Group 1",
	updatedAt: new Date(),
	updaterId: "user123",
};

describe("VolunteerGroup.updater resolver", () => {
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
			resolveEvent(mockVolunteerGroup, {}, unauthenticatedCtx),
		).rejects.toThrow(TalawaGraphQLError);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveEvent(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws an error if event does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveEvent(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
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

		await expect(resolveEvent(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
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

		await expect(resolveEvent(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns event", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user456",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user4567",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});

		const result = await resolveEvent(mockVolunteerGroup, {}, ctx);
		expect(result).toEqual({
			id: "event123",
		});
	});
});
