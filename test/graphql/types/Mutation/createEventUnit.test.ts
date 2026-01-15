import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { putObject: vi.fn() } },
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
			insert: vi.fn(),
			values: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "event-1",
					name: "Test Event",
					organizationId: "org-1",
				},
			]),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				organizationsTable: {
					findFirst: vi.fn(),
				},
				usersTable: {
					findFirst: vi.fn(),
				},
				eventGenerationWindowsTable: {
					findFirst: vi.fn(),
				},
			},
		},
		minio: {
			client: {
				putObject: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
		invalidateEntityLists: vi.fn().mockResolvedValue(undefined),
	};
});

// Configure Drizzle Mock
mocks.drizzle.transaction.mockImplementation(
	(cb: (tx: typeof mocks.tx) => unknown) => cb(mocks.tx),
);
mocks.tx.insert.mockReturnValue(mocks.tx);
mocks.tx.values.mockReturnValue(mocks.tx);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

// Mock cache invalidation functions
vi.mock("~/src/services/caching", () => ({
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
		debug: vi.fn(),
	},
	notification: {
		enqueueEventCreated: vi.fn(),
		flush: vi.fn().mockResolvedValue(undefined),
	},
};

vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: mocks.drizzle,
}));

vi.mock("~/src/services/minio", () => ({
	minio: mocks.minio,
}));

vi.mock("ulidx", () => ({
	ulid: () => "mock-ulid",
}));

vi.mock("uuidv7", () => ({
	uuidv7: () => "mock-uuid",
}));

// Mock the Event type
vi.mock("~/src/graphql/types/Event/Event", () => ({
	Event: "EventType",
}));

vi.mock("~/src/graphql/inputs/MutationCreateEventInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationCreateEventInputSchema: z.object({
			organizationId: z.string().uuid(),
			name: z.string(),
			startAt: z.date(),
			endAt: z.date().optional(),
			description: z.string().optional(),
		}),
		MutationCreateEventInput: "MutationCreateEventInput",
	};
});

vi.mock("~/src/services/eventGeneration", () => ({
	generateInstancesForRecurringEvent: vi.fn().mockResolvedValue(undefined),
	initializeGenerationWindow: vi.fn().mockResolvedValue({ id: "window-1" }),
}));

vi.mock("~/src/utilities/recurringEvent", () => ({
	buildRRuleString: vi.fn().mockReturnValue("RRULE:FREQ=DAILY"),
	validateRecurrenceInput: vi
		.fn()
		.mockReturnValue({ isValid: true, errors: [] }),
}));

import "~/src/graphql/types/Mutation/createEvent";

describe("createEvent Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const createEventCall = calls.find(
			(c: unknown[]) => c[0] === "createEvent",
		);
		if (createEventCall) {
			const fieldDef = createEventCall[1]({
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

	it("should call invalidateEntityLists after successful creation", async () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 1);

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			name: "Admin",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			countryCode: "us",
			name: "Test Org",
			membershipsWhereOrganization: [{ role: "administrator" }],
		});

		const createdEvent = {
			id: "event-1",
			name: "Test Event",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
			startAt: futureDate,
			attachments: [],
			allDay: false,
			isPublic: false,
			isRegisterable: false,
		};
		mocks.tx.returning.mockResolvedValue([createdEvent]);

		const args = {
			input: {
				organizationId: "01234567-89ab-cdef-0123-456789abcdef",
				name: "Test Event",
				startAt: futureDate,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntityLists was called with correct args
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"event",
		);
		expect(mocks.invalidateEntityLists).toHaveBeenCalledTimes(1);
	});

	it("should succeed despite cache invalidation errors (graceful degradation)", async () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 1);

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			name: "Admin",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			countryCode: "us",
			name: "Test Org",
			membershipsWhereOrganization: [{ role: "administrator" }],
		});

		const createdEvent = {
			id: "event-2",
			name: "Test Event 2",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
			startAt: futureDate,
			attachments: [],
			allDay: false,
			isPublic: false,
			isRegisterable: false,
		};
		mocks.tx.returning.mockResolvedValue([createdEvent]);

		// Make cache invalidation throw an error
		mocks.invalidateEntityLists.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				organizationId: "01234567-89ab-cdef-0123-456789abcdef",
				name: "Test Event 2",
				startAt: futureDate,
			},
		};

		// Resolver should succeed despite cache errors (graceful degradation)
		const result = await resolver(null, args, mockContext);

		// Verify the resolver succeeded
		expect(result).toBeDefined();

		// Verify cache invalidation was still attempted
		expect(mocks.invalidateEntityLists).toHaveBeenCalled();

		// Verify warning was logged for the cache error
		expect(mockContext.log.warn).toHaveBeenCalledWith(
			{ error: "Redis unavailable" },
			"Failed to invalidate event list caches (non-fatal)",
		);
	});
});
