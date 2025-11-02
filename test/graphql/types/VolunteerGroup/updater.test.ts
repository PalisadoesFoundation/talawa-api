import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveUpdater } from "~/src/graphql/types/VolunteerGroup/updater";
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
		// const resolveFn = VolunteerGroups._fields.updator.resolve;

		await expect(
			resolveUpdater(mockVolunteerGroup, {}, unauthenticatedCtx),
		).rejects.toThrow(TalawaGraphQLError);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveUpdater(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws an error if event does not exist", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(resolveUpdater(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
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

		await expect(resolveUpdater(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
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

		await expect(resolveUpdater(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns null if updaterId is null", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});

		const result = await resolveUpdater(
			{ ...mockVolunteerGroup, updaterId: null },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	test("returns updator", async () => {
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

		const result = await resolveUpdater(mockVolunteerGroup, {}, ctx);
		expect(result).toEqual({
			id: "user4567",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});
	});

	test("returns if current user is updater", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});

		const result = await resolveUpdater(
			{ ...mockVolunteerGroup, updaterId: "user456" },
			{},
			ctx,
		);
		expect(result).toEqual({
			id: "user123",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
				},
			],
		});
	});

	test("throws an error if updater not found", async () => {
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event123",
			organizationId: "org123",
		});

		// Mock current authenticated user
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user456",
				role: "regular",
				organizationMembershipsWhereMember: [
					{
						role: "regular",
					},
				],
			}) // currentUser (first call)
			.mockResolvedValueOnce(undefined); // existingUser (second call)

		const errorSpy = vi.spyOn(ctx.log, "error");

		await expect(resolveUpdater(mockVolunteerGroup, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(errorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a group's updater id that isn't null.",
		);
	});
});
