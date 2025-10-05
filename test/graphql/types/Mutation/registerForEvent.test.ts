import { expect, test } from "vitest";
import * as schema from "~/src/drizzle/schema";
// Update the import path if the builder module is located elsewhere, for example:
import {
	type RegisterForEventArgs,
	registerForEventResolver,
} from "~/src/graphql/types/Mutation/registerForEvent";
// Example alternative:
// import { builder } from "../../../src/builder";
// import { builder } from "../../../../../src/graphql/builder";

// Mock context and dependencies as needed
type MinioClientMock = {
	dummy?: unknown;
};
type PubSubSubscribeMock = {
	dummy?: unknown;
};

const mockCtx = {
	currentClient: {
		isAuthenticated: true as true,
		user: { id: "user-1" },
	},
	drizzleClient: {
		transaction: async (
			fn: (tx: {
				execute: (query: unknown) => Promise<
					Array<{
						isRegisterable?: boolean;
						capacity?: number;
						count?: number;
						eventId?: string;
						attendeeId?: string;
						creatorId?: string;
						createdAt?: Date;
						updatedAt?: Date | null;
						updaterId?: string | null;
						checkInAt?: Date | null;
						checkOutAt?: Date | null;
					}>
				>;
			}) => Promise<unknown>,
		) =>
			fn({
				execute: async (query: unknown) => {
					// Simulate all required resources for successful registration
					if (
						typeof query === "object" &&
						query &&
						String(query).includes("SELECT * FROM events WHERE id")
					) {
						return [
							{
								eventId: "event-1",
								isRegisterable: true,
								capacity: 100,
								count: 0,
							},
						];
					}
					if (
						typeof query === "object" &&
						query &&
						String(query).includes("INSERT")
					) {
						return [
							{
								eventId: "event-1",
								attendeeId: "user-1",
								creatorId: "user-1",
								createdAt: new Date(),
								updatedAt: null,
								updaterId: null,
								checkInAt: null,
								checkOutAt: null,
							},
						];
					}
					if (
						typeof query === "object" &&
						query &&
						String(query).includes(
							"SELECT * FROM event_attendances WHERE event_id",
						)
					) {
						return [];
					}
					if (
						typeof query === "object" &&
						query &&
						String(query).includes("SELECT COUNT(*)")
					) {
						return [{ count: 0 }];
					}
					if (
						typeof query === "object" &&
						query &&
						String(query).includes("SELECT * FROM events WHERE id")
					) {
						return [{ isRegisterable: true, capacity: 2 }];
					}
					return [];
				},
			}),
		_: {
			schema: undefined,
			fullSchema: schema,
			tableNamesMap: {},
			session: {
				dialect: {},
				prepareQuery: () => undefined,
				execute: () => undefined,
				all: () => undefined,
				count: () => 0,
				transaction: () => Promise.resolve(undefined),
				extra1: undefined,
				extra2: undefined,
			},
		},
		query: undefined,
		$with: undefined,
		$count: undefined,
		all: undefined,
		get: undefined,
		values: undefined,
		insert: undefined,
		select: undefined,
		update: undefined,
		delete: undefined,
		execute: undefined,
		$cache: undefined,
		with: () => undefined,
		selectDistinct: () => undefined,
		selectDistinctOn: () => undefined,
		refreshMaterializedView: () => undefined,
		// ...add more as needed for type compatibility
	},
	envConfig: { API_BASE_URL: "http://localhost:3000" },
	jwt: { sign: () => "mock-jwt-token" },
	log: {
		info: () => {},
		error: () => {},
		warn: () => {},
		debug: () => {},
		child: function () {
			return this;
		},
		level: "info",
		fatal: () => {},
		trace: () => {},
		silent: () => {},
	},
	minio: {
		bucketName: "talawa" as const,
		client: { dummy: undefined } as MinioClientMock,
		config: { endPoint: "localhost", port: 9000 },
	},
	pubsub: {
		subscribe: async () => ({ dummy: undefined }) as PubSubSubscribeMock,
		unsubscribe: () => {},
	},
};

test("registerForEvent: successful registration", async () => {
	const args = { input: { eventId: "event-1" } };
	const result = await registerForEventResolver(
		null,
		args,
		mockCtx as unknown as import("~/src/graphql/context").GraphQLContext,
	);
	expect(result).toMatchObject({
		eventId: "event-1",
		attendeeId: "user-1",
		creatorId: "user-1",
	});
});

test("registerForEvent: missing eventId", async () => {
	// Provide args with missing eventId, but cast to RegisterForEventArgs to satisfy type
	const args = { input: {} } as unknown as RegisterForEventArgs;
	await expect(
		registerForEventResolver(
			null,
			args,
			mockCtx as unknown as import("~/src/graphql/context").GraphQLContext,
		),
	).rejects.toThrow("You have provided invalid arguments for this action.");
});

test("registerForEvent: unauthenticated user", async () => {
	const unauthCtx = {
		...mockCtx,
		currentClient: { isAuthenticated: false as false },
	};
	const args = { input: { eventId: "event-1" } };
	await expect(
		registerForEventResolver(
			null,
			args,
			unauthCtx as unknown as import("~/src/graphql/context").GraphQLContext,
		),
	).rejects.toThrow();
});
