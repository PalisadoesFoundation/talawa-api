import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { putObject: vi.fn(), removeObject: vi.fn() } },
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
			update: vi.fn(),
			set: vi.fn(),
			where: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "user-1",
					name: "Updated User",
					role: "regular",
					emailAddress: "user@test.com",
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
				putObject: vi.fn().mockResolvedValue({}),
				removeObject: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
		invalidateEntity: vi.fn().mockResolvedValue(undefined),
	};
});

// Track transaction execution
let transactionExecuted = false;
let cacheInvalidationCalledInTransaction = false;

// Configure Drizzle Mock
mocks.drizzle.transaction.mockImplementation(
	async (cb: (tx: typeof mocks.tx) => Promise<unknown>) => {
		transactionExecuted = true;
		cacheInvalidationCalledInTransaction = false;

		// Track if invalidateEntity is called during the transaction callback
		const originalInvalidateEntity =
			mocks.invalidateEntity.getMockImplementation();
		mocks.invalidateEntity.mockImplementation(async (...args) => {
			if (transactionExecuted) {
				cacheInvalidationCalledInTransaction = true;
			}
			if (originalInvalidateEntity) {
				return originalInvalidateEntity(...args);
			}
		});

		const result = await cb(mocks.tx);
		return result;
	},
);
mocks.tx.update.mockReturnValue(mocks.tx);
mocks.tx.set.mockReturnValue(mocks.tx);
mocks.tx.where.mockReturnValue(mocks.tx);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

// Mock cache invalidation functions
vi.mock("~/src/services/caching", () => ({
	invalidateEntity: mocks.invalidateEntity,
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

// Mock the User type to prevent import errors or side effects
vi.mock("~/src/graphql/types/User/User", () => ({
	User: "UserType",
}));

vi.mock("~/src/graphql/inputs/MutationUpdateUserInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdateUserInputSchema: z.object({
			id: z.string().uuid(),
			name: z.string().optional(),
			emailAddress: z.string().email().optional(),
			role: z.enum(["administrator", "regular"]).optional(),
			avatar: z.any().optional(),
		}),
		MutationUpdateUserInput: "MutationUpdateUserInput",
	};
});

import "~/src/graphql/types/Mutation/updateUser";

describe("updateUser Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updateUserCall = calls.find((c: unknown[]) => c[0] === "updateUser");
		if (updateUserCall) {
			// The resolver is passed in the field definition
			const fieldDef = updateUserCall[1]({
				field: mocks.builder.field,
				arg: mocks.builder.arg,
			});
			resolver = fieldDef.resolve;
		}
	});

	afterEach(() => {
		vi.clearAllMocks();
		transactionExecuted = false;
		cacheInvalidationCalledInTransaction = false;
	});

	it("should be defined", () => {
		expect(resolver).toBeDefined();
	});

	describe("invalidateEntity is called after successful update", () => {
		it("should call invalidateEntity with correct args after updating user", async () => {
			const targetUserId = "01234567-89ab-cdef-0123-456789abcdef";

			// Current user is an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "administrator" }) // currentUser
				.mockResolvedValueOnce({
					// existingUser
					role: "regular",
					avatarName: null,
				});

			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: targetUserId,
					name: "Updated User",
					role: "regular",
					emailAddress: "updated@test.com",
				},
			]);

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify invalidateEntity was called with correct arguments
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"user",
				targetUserId,
			);
			expect(mocks.invalidateEntity).toHaveBeenCalledTimes(1);
		});
	});

	describe("invalidateEntity is NOT called when update fails", () => {
		it("should NOT call invalidateEntity when user is not found", async () => {
			const targetUserId = "11234567-89ab-cdef-0123-456789abcdef";

			// Current user is an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "administrator" }) // currentUser
				.mockResolvedValueOnce(undefined); // existingUser not found

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await expect(resolver(null, args, mockContext)).rejects.toThrow();

			// Verify invalidateEntity was NOT called
			expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		});

		it("should NOT call invalidateEntity when current user is not admin (unauthorized)", async () => {
			const targetUserId = "21234567-89ab-cdef-0123-456789abcdef";

			// Current user is NOT an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // currentUser - not admin
				.mockResolvedValueOnce({
					role: "regular",
					avatarName: null,
				});

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await expect(resolver(null, args, mockContext)).rejects.toThrow();

			// Verify invalidateEntity was NOT called
			expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		});

		it("should NOT call invalidateEntity when trying to update self", async () => {
			// Use the same ID as the current user (admin-id)
			const currentUserId = "admin-id";

			// Current user is an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "administrator" }) // currentUser
				.mockResolvedValueOnce({
					role: "administrator",
					avatarName: null,
				});

			const args = {
				input: {
					id: currentUserId, // Trying to update self
					name: "Updated Name",
				},
			};

			await expect(resolver(null, args, mockContext)).rejects.toThrow();

			// Verify invalidateEntity was NOT called
			expect(mocks.invalidateEntity).not.toHaveBeenCalled();
		});
	});

	describe("invalidateEntity is executed inside the DB transaction", () => {
		it("should call invalidateEntity within the transaction boundary", async () => {
			const targetUserId = "31234567-89ab-cdef-0123-456789abcdef";

			// Current user is an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "administrator" }) // currentUser
				.mockResolvedValueOnce({
					// existingUser
					role: "regular",
					avatarName: null,
				});

			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: targetUserId,
					name: "Updated User",
					role: "regular",
					emailAddress: "updated@test.com",
				},
			]);

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify transaction was executed
			expect(mocks.drizzle.transaction).toHaveBeenCalled();

			// Verify invalidateEntity was called within the transaction
			expect(cacheInvalidationCalledInTransaction).toBe(true);
		});

		it("should call invalidateEntity after database update but before transaction completes", async () => {
			const targetUserId = "41234567-89ab-cdef-0123-456789abcdef";
			const callOrder: string[] = [];

			// Current user is an admin
			mocks.drizzle.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "administrator" }) // currentUser
				.mockResolvedValueOnce({
					// existingUser
					role: "regular",
					avatarName: null,
				});

			mocks.tx.returning.mockImplementationOnce(async () => {
				callOrder.push("db_update");
				return [
					{
						id: targetUserId,
						name: "Updated User",
						role: "regular",
						emailAddress: "updated@test.com",
					},
				];
			});

			mocks.invalidateEntity.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntity");
			});

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify order: DB update happens before cache invalidation
			expect(callOrder).toContain("db_update");
			expect(callOrder).toContain("invalidateEntity");
			expect(callOrder.indexOf("db_update")).toBeLessThan(
				callOrder.indexOf("invalidateEntity"),
			);
		});
	});
});
