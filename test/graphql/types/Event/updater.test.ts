import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { z } from "zod";
import type { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { resolveEventUpdater } from "../../../../src/graphql/types/Event/updater";

// Define types for the user object structure
type UserRole = z.infer<typeof userRoleEnum>;
type UserObject = {
	id: string;
	role: UserRole;
	organizationMembershipsWhereMember: Array<{ role: UserRole }>;
};

const MockEvent = {
	createdAt: new Date(),
	creatorId: "user_1",
	description: "chat description",
	endAt: new Date(),
	id: "event_1",
	name: "fo",
	organizationId: "organization_1",
	startAt: new Date(),
	updatedAt: new Date(),
	updaterId: "updater_1",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	isInviteOnly: false,
	location: "Test Location",
	isRecurringEventTemplate: false,
	attachmentsPolicy: "inherit",
	recurrenceRule: null,
	recurrenceUntil: null,
	timezone: "UTC",
	attachments: [],
};

describe("Event updater resolver - Tests", () => {
	let authenticatedContext: ReturnType<
		typeof createMockGraphQLContext
	>["context"];
	let unauthenticatedContext: ReturnType<
		typeof createMockGraphQLContext
	>["context"];
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		authenticatedContext = context;
		unauthenticatedContext = createMockGraphQLContext(false).context;
		mocks = newMocks;
	});
	it("throws an unauthenticated error if the client is not authenticated", async () => {
		await expect(
			resolveEventUpdater(MockEvent, {}, unauthenticatedContext),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.stringMatching(
					/You must be authenticated to perform this action./i,
				),
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws an unauthenticated error if the current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() =>
			Promise.resolve(undefined),
		);

		await expect(
			resolveEventUpdater(MockEvent, {}, authenticatedContext),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws unauthorized_action error if current user is not administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		});

		await expect(
			resolveEventUpdater(MockEvent, {}, authenticatedContext),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: {
					code: "unauthorized_action",
					message: expect.stringMatching(
						/Only administrators can access event updater information./i,
					),
				},
			}),
		);
	});

	it("should return user as null if event (parent) has no updaterId ", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const eventWithoutUpdater = {
			...MockEvent,
			updaterId: null,
		};

		const result = await resolveEventUpdater(
			eventWithoutUpdater,
			{},
			authenticatedContext,
		);
		expect(result).toBeNull();
	});

	it("returns the current user if updaterId matches current user's id", async () => {
		const mockCurrentUser: UserObject = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		// Mock the event with updaterId matching the current user's id
		const eventWithCurrentUserAsUpdater = {
			...MockEvent,
			updaterId: "user-123", // Same as mockCurrentUser.id
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockCurrentUser,
		);

		const result = await resolveEventUpdater(
			eventWithCurrentUserAsUpdater,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(mockCurrentUser);
	});

	it("returns the currentUser if user is global administrator and event has updaterId", async () => {
		const MockUser: UserObject = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(MockUser);

		const result = await resolveEventUpdater(
			MockEvent,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(MockUser);
	});

	it("return currentUser if user is not the global administrator but organization administrator and event has updaterId", async () => {
		const MockUser: UserObject = {
			id: "user-123",
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(MockUser);

		const result = await resolveEventUpdater(
			MockEvent,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(MockUser);
	});

	it("returns the updater user if updaterId differs from current user's id", async () => {
		const mockCurrentUser: UserObject = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		const mockUpdaterUser: UserObject = {
			id: "updater_1",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockCurrentUser)
			.mockResolvedValueOnce(mockUpdaterUser);

		const result = await resolveEventUpdater(
			MockEvent,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(mockUpdaterUser);
	});

	it("throws unexpected error when the updaterId user does not exist", async () => {
		const mockCurrentUser: UserObject = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockCurrentUser)
			.mockResolvedValueOnce(undefined);

		await expect(
			resolveEventUpdater(MockEvent, {}, authenticatedContext),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: {
					code: "unexpected",
					message: expect.stringMatching(
						/Event updater not found in the database. This indicates a data integrity issue./i,
					),
				},
			}),
		);

		expect(authenticatedContext.log.error).toHaveBeenLastCalledWith(
			"Postgres select operation returned an empty array for an event's updater id that isn't null.",
		);
	});
});
