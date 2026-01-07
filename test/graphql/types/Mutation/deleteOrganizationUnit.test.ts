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

// Mock the Organization type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Organization/Organization", () => ({
	Organization: "OrganizationType",
}));

vi.mock("~/src/graphql/inputs/MutationDeleteOrganizationInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationDeleteOrganizationInputSchema: z.object({
			id: z.string().uuid(),
		}),
		MutationDeleteOrganizationInput: "MutationDeleteOrganizationInput",
	};
});

import "~/src/graphql/types/Mutation/deleteOrganization";

describe("deleteOrganization Resolver Unit Coverage", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const deleteOrgCall = calls.find(
			(c: unknown[]) => c[0] === "deleteOrganization",
		);
		if (deleteOrgCall) {
			// The resolver is passed in the field definition
			const fieldDef = deleteOrgCall[1]({
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

	it("should call invalidateEntity with correct organization ID after successful deletion", async () => {
		const orgId = "01234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: orgId,
			avatarName: null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: orgId,
				name: "Deleted Org",
				countryCode: "us",
			},
		]);

		const args = {
			input: {
				id: orgId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntity was called with correct organization ID
		expect(mocks.invalidateEntity).toHaveBeenCalledWith(
			mockContext.cache,
			"organization",
			orgId,
		);
	});

	it("should call invalidateEntityLists after successful deletion", async () => {
		const orgId = "11234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: orgId,
			avatarName: null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: orgId,
				name: "Deleted Org",
				countryCode: "us",
			},
		]);

		const args = {
			input: {
				id: orgId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntityLists was called for organization
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"organization",
		);
	});

	it("should NOT call cache invalidation when deletion fails (org not found)", async () => {
		const orgId = "21234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue(
			undefined,
		);

		const args = {
			input: {
				id: orgId,
			},
		};

		await expect(resolver(null, args, mockContext)).rejects.toThrow();

		// Verify cache invalidation was NOT called
		expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
	});

	it("should call cache invalidation in correct order (delete DB first, then invalidate cache)", async () => {
		const orgId = "31234567-89ab-cdef-0123-456789abcdef";
		const callOrder: string[] = [];

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: orgId,
			avatarName: null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});
		mocks.tx.returning.mockImplementation(async () => {
			callOrder.push("db_delete");
			return [{ id: orgId, name: "Deleted Org", countryCode: "us" }];
		});
		mocks.invalidateEntity.mockImplementation(async () => {
			callOrder.push("invalidateEntity");
		});
		mocks.invalidateEntityLists.mockImplementation(async () => {
			callOrder.push("invalidateEntityLists");
		});

		const args = {
			input: {
				id: orgId,
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

	it("should succeed despite cache invalidation errors (graceful degradation)", async () => {
		const orgId = "41234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: orgId,
			avatarName: null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: orgId,
				name: "Deleted Org",
				countryCode: "us",
			},
		]);

		// Make cache invalidation throw an error
		mocks.invalidateEntity.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				id: orgId,
			},
		};

		// Resolver should succeed despite cache errors
		const result = await resolver(null, args, mockContext);

		expect(result).toEqual({
			id: orgId,
			name: "Deleted Org",
			countryCode: "us",
		});

		expect(mocks.invalidateEntity).toHaveBeenCalled();
		expect(mockContext.log.warn).toHaveBeenCalledWith(
			{ error: "Redis unavailable" },
			"Failed to invalidate organization cache (non-fatal)",
		);
	});

	it("should succeed despite invalidateEntityLists throwing an error (graceful degradation)", async () => {
		const orgId = "51234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: orgId,
			avatarName: null,
			advertisementsWhereOrganization: [],
			chatsWhereOrganization: [],
			eventsWhereOrganization: [],
			postsWhereOrganization: [],
			venuesWhereOrganization: [],
		});
		mocks.tx.returning.mockResolvedValue([
			{
				id: orgId,
				name: "Deleted Org",
				countryCode: "us",
			},
		]);

		// invalidateEntity succeeds, invalidateEntityLists fails
		mocks.invalidateEntity.mockResolvedValueOnce(undefined);
		mocks.invalidateEntityLists.mockRejectedValueOnce(
			new Error("Redis timeout"),
		);

		const args = {
			input: {
				id: orgId,
			},
		};

		// Resolver should succeed despite cache errors
		const result = await resolver(null, args, mockContext);

		expect(result).toEqual({
			id: orgId,
			name: "Deleted Org",
			countryCode: "us",
		});

		expect(mocks.invalidateEntityLists).toHaveBeenCalled();
		expect(mockContext.log.warn).toHaveBeenCalledWith(
			{ error: "Redis timeout" },
			"Failed to invalidate organization cache (non-fatal)",
		);
	});
});
