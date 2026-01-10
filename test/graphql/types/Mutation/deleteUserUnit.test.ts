import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { removeObject: vi.fn() } },
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
					id: "user-1",
					name: "Test User",
					role: "member",
				},
			]),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				usersTable: {
					findFirst: vi.fn(),
				},
			},
		},
		minio: {
			client: {
				removeObject: vi.fn().mockResolvedValue({}),
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

// Mock the User type
vi.mock("~/src/graphql/types/User/User", () => ({
	User: "UserType",
}));

vi.mock("~/src/graphql/inputs/MutationDeleteUserInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationDeleteUserInputSchema: z.object({
			id: z.string().uuid(),
		}),
		MutationDeleteUserInput: "MutationDeleteUserInput",
	};
});

import "~/src/graphql/types/Mutation/deleteUser";

describe("deleteUser Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const deleteUserCall = calls.find((c: unknown[]) => c[0] === "deleteUser");
		if (deleteUserCall) {
			const fieldDef = deleteUserCall[1]({
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

	it("should call invalidateEntity and invalidateEntityLists after successful deletion", async () => {
		const userId = "01234567-89ab-cdef-0123-456789abcdef";

		// Current user is admin
		mocks.drizzle.query.usersTable.findFirst
			.mockResolvedValueOnce({
				role: "administrator",
			})
			// User to delete exists
			.mockResolvedValueOnce({
				avatarName: null,
			});

		mocks.tx.returning.mockResolvedValue([
			{
				id: userId,
				name: "Deleted User",
			},
		]);

		const args = {
			input: {
				id: userId,
			},
		};

		await resolver(null, args, mockContext);

		// Verify invalidateEntity was called with correct args
		expect(mocks.invalidateEntity).toHaveBeenCalledWith(
			mockContext.cache,
			"user",
			userId,
		);

		// Verify invalidateEntityLists was called with correct args
		expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
			mockContext.cache,
			"user",
		);
	});

	it("should succeed despite cache invalidation errors (graceful degradation)", async () => {
		const userId = "11234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst
			.mockResolvedValueOnce({
				role: "administrator",
			})
			.mockResolvedValueOnce({
				avatarName: null,
			});

		mocks.tx.returning.mockResolvedValue([
			{
				id: userId,
				name: "Deleted User",
			},
		]);

		// Make cache invalidation throw an error
		mocks.invalidateEntity.mockRejectedValueOnce(
			new Error("Redis unavailable"),
		);

		const args = {
			input: {
				id: userId,
			},
		};

		// Resolver should succeed despite cache errors
		const result = await resolver(null, args, mockContext);

		expect(result).toBeDefined();
		expect(mocks.invalidateEntity).toHaveBeenCalled();
		expect(mockContext.log.warn).toHaveBeenCalledWith(
			{ error: "Redis unavailable" },
			"Failed to invalidate user cache (non-fatal)",
		);
	});

	it("should NOT call cache invalidation when user not found", async () => {
		const userId = "21234567-89ab-cdef-0123-456789abcdef";

		mocks.drizzle.query.usersTable.findFirst
			.mockResolvedValueOnce({
				role: "administrator",
			})
			.mockResolvedValueOnce(undefined); // User not found

		const args = {
			input: {
				id: userId,
			},
		};

		await expect(resolver(null, args, mockContext)).rejects.toThrow();

		// Verify cache invalidation was NOT called
		expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
	});

	it("should call cache invalidation in correct order (delete DB first, then invalidate cache)", async () => {
		const userId = "31234567-89ab-cdef-0123-456789abcdef";
		const callOrder: string[] = [];

		mocks.drizzle.query.usersTable.findFirst
			.mockResolvedValueOnce({
				role: "administrator",
			})
			.mockResolvedValueOnce({
				avatarName: null,
			});

		mocks.tx.returning.mockImplementation(async () => {
			callOrder.push("db_delete");
			return [{ id: userId, name: "Deleted User" }];
		});
		mocks.invalidateEntity.mockImplementation(async () => {
			callOrder.push("invalidateEntity");
		});
		mocks.invalidateEntityLists.mockImplementation(async () => {
			callOrder.push("invalidateEntityLists");
		});

		const args = {
			input: {
				id: userId,
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
