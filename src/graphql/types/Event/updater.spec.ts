import type { FastifyInstance } from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { PubSub } from "../../pubsub";
import { resolveEventUpdater } from "./updater";
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
};

const drizzleClientMock = {
	query: {
		usersTable: {
			findFirst: vi.fn(),
		},
	},
} as unknown as FastifyInstance["drizzleClient"];

const authenticatedContext = {
	currentClient: {
		isAuthenticated: true as const,
		user: {
			id: "user_1",
		},
	},
	drizzleClient: drizzleClientMock,
	envConfig: { API_BASE_URL: "API_BASE" },
	log: { error: vi.fn() } as unknown as FastifyInstance["log"],
	minio: {} as unknown as FastifyInstance["minio"],
	jwt: {
		sign: vi.fn(),
	},
	pubsub: {} as unknown as PubSub,
};

const unauthenticatedContext = {
	...authenticatedContext,
	currentClient: {
		isAuthenticated: false as const,
	},
};

describe("resolveEventUpdater", async () => {
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
		// @ts-ignore
		drizzleClientMock.query.usersTable.findFirst.mockReturnValue(undefined);

		await expect(
			resolveEventUpdater(MockEvent, {}, authenticatedContext),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});
	it("throws unauthorized_action error if current user is not administrator", async () => {
		// @ts-ignore
		drizzleClientMock.query.usersTable.findFirst.mockReturnValue({
			role: "regular",
			organizationMembershipsWhereMember: [{}],
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
		//@ts-ignore
		drizzleClientMock.query.usersTable.findFirst.mockReturnValue({
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const eventWithoutUpdater = {
			...MockEvent,
			updaterId: null,
		}; // event with no updater id

		const result = await resolveEventUpdater(
			eventWithoutUpdater,
			{},
			authenticatedContext,
		);
		expect(result).toBeNull();
	});
	it("returns the currentUser if user is global administrator and event has updaterId", async () => {
		// not mocking all the values of the user
		const MockUser = {
			id: "updater_1", // user with the id same as MockEvent.updaterId
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		};
		// @ts-ignore
		drizzleClientMock.query.usersTable.findFirst.mockReturnValue(MockUser);

		const result = await resolveEventUpdater(
			MockEvent,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(MockUser);
	});
	it("return currentUser if user is not the global administrator but organization administrator and event has updaterId", async () => {
		// not mocking all the values of the user
		const MockUser = {
			id: "updater_1", // id matches with Event.updaterId
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};
		// @ts-ignore
		drizzleClientMock.query.usersTable.findFirst.mockReturnValue(MockUser);
		expect(
			resolveEventUpdater(MockEvent, {}, authenticatedContext),
		).resolves.toEqual(MockUser);
	});

	it("returns the updater user if updaterId differs from current user's id", async () => {
		const mockCurrentUser = {
			id: "user_1",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};
		// user which updated the event
		const mockUpdaterUser = {
			id: "updater_1",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		// The first call returns the current user, and the second returns the updater user
		drizzleClientMock.query.usersTable.findFirst
			// @ts-ignore
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
		const mockCurrentUser = {
			id: "user_1",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator " }],
		};

		drizzleClientMock.query.usersTable.findFirst
			// @ts-ignore
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
