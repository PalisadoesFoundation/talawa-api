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
					id: "post-1",
					caption: "Test Post",
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
			},
		},
		minio: {
			client: {
				putObject: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
		invalidateEntityLists: vi.fn().mockResolvedValue(undefined),
		notificationEventBus: {
			emitPostCreated: vi.fn(),
		},
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

// Mock notification event bus
vi.mock("~/src/graphql/types/Notification/EventBus/eventBus", () => ({
	notificationEventBus: mocks.notificationEventBus,
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

vi.mock("ulidx", () => ({
	ulid: () => "mock-ulid",
}));

vi.mock("uuidv7", () => ({
	uuidv7: () => "mock-uuid",
}));

// Mock the Post type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Post/Post", () => ({
	Post: "PostType",
}));

vi.mock("~/src/graphql/inputs/MutationCreatePostInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationCreatePostInputSchema: z.object({
			organizationId: z.string().uuid(),
			caption: z.string().optional(),
			body: z.string().optional(),
		}),
		MutationCreatePostInput: "MutationCreatePostInput",
	};
});

vi.mock("~/src/utilities/getKeyPathsWithNonUndefinedValues", () => ({
	getKeyPathsWithNonUndefinedValues: () => [],
}));

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
}));

import "~/src/graphql/types/Mutation/createPost";

describe("createPost Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const createPostCall = calls.find((c: unknown[]) => c[0] === "createPost");
		if (createPostCall) {
			const fieldDef = createPostCall[1]({
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
		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			name: "Admin",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			countryCode: "us",
			name: "Test Org",
			membershipsWhereOrganization: [{ role: "administrator" }],
		});

		const createdPost = {
			id: "post-1",
			caption: "Test Post",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
			attachments: [],
		};
		mocks.tx.returning.mockResolvedValue([createdPost]);

		const args = {
			input: {
				organizationId: "01234567-89ab-cdef-0123-456789abcdef",
				caption: "Test Post",
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntityLists was called with correct args
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"post",
		);
		expect(mocks.invalidateEntityLists).toHaveBeenCalledTimes(1);
	});

	it("should succeed despite cache invalidation errors (graceful degradation)", async () => {
		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			name: "Admin",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			countryCode: "us",
			name: "Test Org",
			membershipsWhereOrganization: [{ role: "administrator" }],
		});

		const createdPost = {
			id: "post-2",
			caption: "Test Post 2",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
		};
		mocks.tx.returning.mockResolvedValue([createdPost]);

		// Make cache invalidation throw an error
		mocks.invalidateEntityLists.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				organizationId: "01234567-89ab-cdef-0123-456789abcdef",
				caption: "Test Post 2",
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
			"Failed to invalidate post list caches (non-fatal)",
		);
	});
});
