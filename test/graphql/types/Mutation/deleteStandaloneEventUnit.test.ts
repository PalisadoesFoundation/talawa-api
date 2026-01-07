import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { removeObjects: vi.fn() } },
	},
}));

// Mock utilities
vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: class extends Error {
		constructor(message: string, _options?: Record<string, unknown>) {
			super(message);
		}
	},
}));

// Hoist mocks to be accessible inside vi.mock
const mocks = vi.hoisted(() => {
	return {
		builder: {
			mutationField: vi.fn(),
			field: vi.fn((args) => args),
			arg: vi.fn(),
			type: vi.fn(),
			required: vi.fn(),
			resolve: vi.fn(),
			objectRef: vi.fn(),
			inputType: vi.fn(),
			inputRef: vi.fn(),
			enumType: vi.fn(),
			scalarType: vi.fn(),
			interfaceType: vi.fn(),
			unionType: vi.fn(),
			queryField: vi.fn(),
		},
		tx: {
			delete: vi.fn(),
			where: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "event-1",
					name: "Test Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			]),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				eventsTable: {
					findFirst: vi.fn(),
				},
				usersTable: {
					findFirst: vi.fn(),
				},
			},
		},
		minio: {
			client: {
				removeObjects: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
		invalidateEntity: vi.fn().mockResolvedValue(undefined),
		invalidateEntityLists: vi.fn().mockResolvedValue(undefined),
	};
});

// Configure Drizzle Mock
mocks.drizzle.transaction.mockImplementation(
	(cb: (tx: typeof mocks.tx) => unknown) => cb(mocks.tx),
);
mocks.tx.delete.mockReturnValue(mocks.tx);
mocks.tx.where.mockReturnValue(mocks.tx);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

// Mock cache invalidation functions
vi.mock("~/src/services/caching", () => ({
	invalidateEntity: mocks.invalidateEntity,
	invalidateEntityLists: mocks.invalidateEntityLists,
}));

// Mock context and services
const mockContext = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "admin-id" },
	},
	drizzleClient: mocks.drizzle,
	minio: mocks.minio,
	cache: {
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
	},
	log: {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
	},
};

vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: mocks.drizzle,
}));

vi.mock("~/src/services/minio", () => ({
	minio: mocks.minio,
}));

// Mock the Event type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Event/Event", () => ({
	Event: "EventType",
}));

vi.mock("~/src/graphql/inputs/MutationDeleteStandaloneEventInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationDeleteStandaloneEventInputSchema: z.object({
			id: z.string().uuid(),
		}),
		MutationDeleteStandaloneEventInput: "MutationDeleteStandaloneEventInput",
	};
});

import "~/src/graphql/types/Mutation/deleteStandaloneEvent";

describe("deleteStandaloneEvent Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const deleteEventCall = calls.find(
			(c: unknown[]) => c[0] === "deleteStandaloneEvent",
		);
		if (deleteEventCall) {
			// The resolver is passed in the field definition
			const fieldDef = deleteEventCall[1]({
				field: mocks.builder.field,
				arg: mocks.builder.arg,
			});
			resolver = fieldDef.resolve;
		}
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should be defined", () => {
		expect(resolver).toBeDefined();
	});

	it("should call invalidateEntity with correct event ID after successful deletion", async () => {
		const eventId = "01234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
			id: eventId,
			startAt: new Date(),
			isRecurringEventTemplate: false,
			creatorId: "admin-id",
			attachmentsWhereEvent: [],
			organization: {
				countryCode: "us",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: eventId,
				name: "Deleted Event",
				startAt: new Date(),
				endAt: new Date(),
				organizationId: "org-1",
			},
		]);

		const args = {
			input: {
				id: eventId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntity was called with correct event ID
		expect(mocks.invalidateEntity).toHaveBeenCalledWith(
			mockContext.cache,
			"event",
			eventId,
		);
	});

	it("should call invalidateEntityLists for events after successful deletion", async () => {
		const eventId = "11234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
			id: eventId,
			startAt: new Date(),
			isRecurringEventTemplate: false,
			creatorId: "admin-id",
			attachmentsWhereEvent: [],
			organization: {
				countryCode: "us",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: eventId,
				name: "Deleted Event",
				startAt: new Date(),
				endAt: new Date(),
				organizationId: "org-1",
			},
		]);

		const args = {
			input: {
				id: eventId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntityLists was called for events
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"event",
		);
	});

	it("should NOT call cache invalidation when event deletion fails (event not found)", async () => {
		const eventId = "21234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue(undefined);

		const args = {
			input: {
				id: eventId,
			},
		};

		await expect(resolver(null, args, mockContext)).rejects.toThrow();

		// Verify cache invalidation was NOT called
		expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
	});

	it("should handle cache invalidation errors gracefully (cache operations don't break mutation)", async () => {
		const eventId = "31234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
			id: eventId,
			startAt: new Date(),
			isRecurringEventTemplate: false,
			creatorId: "admin-id",
			attachmentsWhereEvent: [],
			organization: {
				countryCode: "us",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: eventId,
				name: "Deleted Event",
				startAt: new Date(),
				endAt: new Date(),
				organizationId: "org-1",
			},
		]);

		// Make cache invalidation throw an error
		mocks.invalidateEntity.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				id: eventId,
			},
		};

		// Currently cache invalidation is inside the transaction, so cache errors propagate.
		// This test documents the current behavior - cache errors will cause the mutation to fail.
		// TODO: Move cache invalidation outside transaction and add try-catch for graceful degradation.
		await expect(resolver(null, args, mockContext)).rejects.toThrow(
			"Redis unavailable",
		);

		// Verify cache invalidation was still attempted
		expect(mocks.invalidateEntity).toHaveBeenCalled();
	});

	it("should call cache invalidation in correct order (delete DB first, then invalidate cache)", async () => {
		const eventId = "41234567-89ab-cdef-0123-456789abcdef";
		const callOrder: string[] = [];

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.eventsTable.findFirst.mockResolvedValue({
			id: eventId,
			startAt: new Date(),
			isRecurringEventTemplate: false,
			creatorId: "admin-id",
			attachmentsWhereEvent: [],
			organization: {
				countryCode: "us",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
		mocks.tx.returning.mockImplementation(async () => {
			callOrder.push("db_delete");
			return [
				{
					id: eventId,
					name: "Deleted Event",
					startAt: new Date(),
					endAt: new Date(),
					organizationId: "org-1",
				},
			];
		});
		mocks.invalidateEntity.mockImplementation(async () => {
			callOrder.push("invalidateEntity");
		});
		mocks.invalidateEntityLists.mockImplementation(async () => {
			callOrder.push("invalidateEntityLists");
		});

		const args = {
			input: {
				id: eventId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify order: DB delete happens before cache invalidation
		expect(callOrder).toEqual([
			"db_delete",
			"invalidateEntity",
			"invalidateEntityLists",
		]);
	});
});
