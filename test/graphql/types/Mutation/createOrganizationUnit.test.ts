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

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
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
					id: "org-1",
					name: "Test Org",
					countryCode: "us",
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

// Mock the Organization type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Organization/Organization", () => ({
	Organization: "OrganizationType",
}));

vi.mock("~/src/graphql/inputs/MutationCreateOrganizationInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationCreateOrganizationInputSchema: z.object({
			name: z.string(),
			description: z.string().optional(),
		}),
		MutationCreateOrganizationInput: "MutationCreateOrganizationInput",
	};
});

vi.mock("~/src/drizzle/enums/imageMimeType", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		imageMimeTypeEnum: z.enum(["image/png"]),
	};
});

import "~/src/graphql/types/Mutation/createOrganization";

describe("createOrganization Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const createOrgCall = calls.find(
			(c: unknown[]) => c[0] === "createOrganization",
		);
		if (createOrgCall) {
			// The resolver is passed in the field definition
			const fieldDef = createOrgCall[1]({
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
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		); // No duplicate name

		mocks.tx.returning.mockResolvedValue([
			{
				id: "org-1",
				name: "Test Org",
				countryCode: "us",
			},
		]);

		const args = {
			input: {
				name: "Test Org",
				description: "Test Description",
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntityLists was called with correct args
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"organization",
		);
		expect(mocks.invalidateEntityLists).toHaveBeenCalledTimes(1);
	});

	it("should succeed despite cache invalidation errors (graceful degradation)", async () => {
		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		); // No duplicate name

		const createdOrg = {
			id: "org-2",
			name: "Test Org 2",
			countryCode: "us",
		};
		mocks.tx.returning.mockResolvedValue([createdOrg]);

		// Make cache invalidation throw an error
		mocks.invalidateEntityLists.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				name: "Test Org 2",
				description: "Test Description",
			},
		};

		// Resolver should succeed despite cache errors (graceful degradation)
		const result = await resolver(null, args, mockContext);

		// Verify the resolver succeeded and returned the created organization
		expect(result).toEqual(createdOrg);

		// Verify cache invalidation was still attempted
		expect(mocks.invalidateEntityLists).toHaveBeenCalled();

		// Verify warning was logged for the cache error
		expect(mockContext.log.warn).toHaveBeenCalledWith(
			{ error: "Redis unavailable" },
			"Failed to invalidate organization list caches (non-fatal)",
		);
	});

	it("should call cache invalidation after transaction commits (correct order)", async () => {
		const callOrder: string[] = [];

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		mocks.tx.returning.mockImplementation(async () => {
			callOrder.push("tx_commit");
			return [{ id: "org-3", name: "Test Org 3", countryCode: "us" }];
		});

		mocks.invalidateEntityLists.mockImplementation(async () => {
			callOrder.push("invalidateEntityLists");
		});

		const args = {
			input: {
				name: "Test Org 3",
				description: "Test Description",
			},
		};

		await resolver(null, args, mockContext);

		// Verify order: transaction commits before cache invalidation
		expect(callOrder).toEqual(["tx_commit", "invalidateEntityLists"]);
	});
});
