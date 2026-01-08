/**
 * Unit Tests for updateUser Resolver - Cache Invalidation Logic
 *
 * PURPOSE: These unit tests specifically verify cache invalidation behavior
 * which cannot be easily asserted in integration tests. They complement the
 * comprehensive integration tests in updateUser.test.ts.
 *
 * WHY UNIT TESTS FOR CACHE INVALIDATION:
 * - Integration tests (updateUser.test.ts) verify end-to-end behavior via mercuriusClient
 *   and cover all error paths, validation, authentication, and successful updates
 * - Unit tests here verify internal implementation details that are invisible to
 *   integration tests:
 *     1. invalidateEntity is called with correct entity type ("user") and user ID
 *     2. invalidateEntityLists is called with correct entity type ("user")
 *     3. Cache invalidation runs AFTER the database transaction commits
 *     4. Graceful degradation when cache operations fail (mutation still succeeds)
 *     5. No cache invalidation occurs on failed updates (error paths early-exit)
 *
 * TRADEOFFS:
 * - Heavy mocking makes these tests fragile to internal refactoring
 * - But they provide valuable coverage for cache invalidation correctness
 * - If the resolver's internal structure changes significantly, these tests
 *   will need updating - this is acceptable given the value they provide
 *
 * TESTING STRATEGY:
 * - For end-to-end mutation behavior → see updateUser.test.ts (mercuriusClient)
 * - For cache invalidation verification → this file (mock-based unit tests)
 *
 * @see {@link file://./updateUser.test.ts} for integration tests
 */

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

// Mock utilities - TalawaGraphQLError mock matches real constructor signature
vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: class TalawaGraphQLError extends Error {
		extensions: Record<string, unknown>;

		constructor(options: {
			message?: string;
			extensions: Record<string, unknown>;
		}) {
			super(options.message ?? "GraphQL Error");
			this.extensions = options.extensions;
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
		invalidateEntityLists: vi.fn().mockResolvedValue(undefined),
	};
});

// Track transaction execution and post-transaction invalidation
let transactionCompleted = false;
let invalidatedAfterTx = false;
const txCallOrder: string[] = [];

// Configure Drizzle Mock to track transaction completion and post-tx invalidation
mocks.drizzle.transaction.mockImplementation(
	async (cb: (tx: typeof mocks.tx) => Promise<unknown>) => {
		transactionCompleted = false;
		invalidatedAfterTx = false;
		txCallOrder.length = 0;

		// Track if invalidateEntity is called after the transaction completes
		const originalInvalidateEntity =
			mocks.invalidateEntity.getMockImplementation();
		mocks.invalidateEntity.mockImplementation(async (...args) => {
			txCallOrder.push("invalidateEntity");
			if (transactionCompleted) {
				invalidatedAfterTx = true;
			}
			if (originalInvalidateEntity) {
				return originalInvalidateEntity(...args);
			}
		});

		// Track if invalidateEntityLists is called after the transaction completes
		const originalInvalidateEntityLists =
			mocks.invalidateEntityLists.getMockImplementation();
		mocks.invalidateEntityLists.mockImplementation(async (...args) => {
			txCallOrder.push("invalidateEntityLists");
			if (transactionCompleted) {
				invalidatedAfterTx = true;
			}
			if (originalInvalidateEntityLists) {
				return originalInvalidateEntityLists(...args);
			}
		});

		const result = await cb(mocks.tx);
		txCallOrder.push("tx_commit");
		transactionCompleted = true;
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

// Mock the User type to prevent import errors or side effects
vi.mock("~/src/graphql/types/User/User", () => ({
	User: "UserType",
}));

vi.mock("~/src/graphql/inputs/MutationUpdateUserInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		// Mock schema mirrors the real mutationUpdateUserInputSchema fields
		mutationUpdateUserInputSchema: z.object({
			id: z.string().uuid(),
			// All optional fields from the real schema
			addressLine1: z.string().min(1).max(1024).nullish(),
			addressLine2: z.string().min(1).max(1024).nullish(),
			avatar: z.any().nullish(),
			birthDate: z.date().nullish(),
			city: z.string().min(1).max(64).nullish(),
			countryCode: z.string().length(2).nullish(),
			description: z.string().min(1).max(2048).nullish(),
			educationGrade: z.string().nullish(),
			emailAddress: z.string().email().optional(),
			employmentStatus: z.string().nullish(),
			homePhoneNumber: z.string().nullish(),
			isEmailAddressVerified: z.boolean().optional(),
			maritalStatus: z.string().nullish(),
			mobilePhoneNumber: z.string().nullish(),
			name: z.string().min(1).max(256).optional(),
			natalSex: z.string().nullish(),
			naturalLanguageCode: z.string().nullish(),
			password: z.string().min(1).max(64).optional(),
			postalCode: z.string().min(1).max(32).nullish(),
			role: z.enum(["administrator", "regular"]).optional(),
			state: z.string().min(1).max(64).nullish(),
			workPhoneNumber: z.string().nullish(),
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
		transactionCompleted = false;
		invalidatedAfterTx = false;
		txCallOrder.length = 0;
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

			// Verify invalidateEntityLists was called with correct arguments
			expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
				mockContext.cache,
				"user",
			);
			expect(mocks.invalidateEntityLists).toHaveBeenCalledTimes(1);
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
			expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
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
			expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
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
			expect(mocks.invalidateEntityLists).not.toHaveBeenCalled();
		});
	});

	describe("invalidateEntity is executed after the DB transaction completes", () => {
		it("should call invalidateEntity after the transaction commits", async () => {
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

			// Verify invalidateEntity was called after the transaction completed
			expect(invalidatedAfterTx).toBe(true);

			// Verify call order: transaction commits before invalidation
			expect(txCallOrder.indexOf("tx_commit")).toBeLessThan(
				txCallOrder.indexOf("invalidateEntity"),
			);

			// Verify invalidateEntityLists was also called after transaction commit
			expect(txCallOrder).toContain("invalidateEntityLists");
			expect(txCallOrder.indexOf("tx_commit")).toBeLessThan(
				txCallOrder.indexOf("invalidateEntityLists"),
			);
		});

		it("should call invalidateEntity after database update and transaction commit completes", async () => {
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
				callOrder.push("tx_returning");
				return [
					{
						id: targetUserId,
						name: "Updated User",
						role: "regular",
						emailAddress: "updated@test.com",
					},
				];
			});

			// Track transaction commit by wrapping the transaction mock
			const originalTransactionImpl =
				mocks.drizzle.transaction.getMockImplementation();
			mocks.drizzle.transaction.mockImplementationOnce(
				async (cb: (tx: typeof mocks.tx) => Promise<unknown>) => {
					const result = await cb(mocks.tx);
					callOrder.push("tx_commit");
					return result;
				},
			);

			mocks.invalidateEntity.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntity");
			});

			mocks.invalidateEntityLists.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntityLists");
			});

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Restore original transaction mock for other tests
			if (originalTransactionImpl) {
				mocks.drizzle.transaction.mockImplementation(originalTransactionImpl);
			}

			// Verify order: tx.returning completes → transaction commits → cache invalidation
			expect(callOrder).toContain("tx_returning");
			expect(callOrder).toContain("tx_commit");
			expect(callOrder).toContain("invalidateEntity");
			expect(callOrder).toContain("invalidateEntityLists");

			// Assert tx.returning completes before transaction commit
			expect(callOrder.indexOf("tx_returning")).toBeLessThan(
				callOrder.indexOf("tx_commit"),
			);

			// Assert invalidateEntity is called after tx.returning handler finished
			expect(callOrder.indexOf("tx_returning")).toBeLessThan(
				callOrder.indexOf("invalidateEntity"),
			);

			// Assert invalidateEntity is called after transaction commit
			// This verifies the actual flow: DB update → transaction commit → cache invalidation
			expect(callOrder.indexOf("tx_commit")).toBeLessThan(
				callOrder.indexOf("invalidateEntity"),
			);

			// Assert invalidateEntityLists is called after transaction commit
			expect(callOrder.indexOf("tx_commit")).toBeLessThan(
				callOrder.indexOf("invalidateEntityLists"),
			);
		});
	});

	describe("Cache invalidation error handling (graceful degradation)", () => {
		it("should succeed despite cache invalidation errors and log warning", async () => {
			const targetUserId = "51234567-89ab-cdef-0123-456789abcdef";

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

			// Make cache invalidation throw an error
			mocks.invalidateEntity.mockRejectedValueOnce(
				new Error("Redis connection failed"),
			);

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded and returned the updated user
			expect(result).toEqual({
				id: targetUserId,
				name: "Updated User",
				role: "regular",
				emailAddress: "updated@test.com",
			});

			// Verify cache invalidation was attempted
			expect(mocks.invalidateEntity).toHaveBeenCalled();

			// Verify warning was logged for the cache error
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{ error: "Redis connection failed" },
				"Failed to invalidate user cache (non-fatal)",
			);
		});

		it("should succeed despite invalidateEntityLists errors and log warning", async () => {
			const targetUserId = "61234567-89ab-cdef-0123-456789abcdef";

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

			// invalidateEntity succeeds, but invalidateEntityLists fails
			mocks.invalidateEntity.mockResolvedValueOnce(undefined);
			mocks.invalidateEntityLists.mockRejectedValueOnce(
				new Error("Redis connection failed on list invalidation"),
			);

			const args = {
				input: {
					id: targetUserId,
					name: "Updated Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded and returned the updated user
			expect(result).toEqual({
				id: targetUserId,
				name: "Updated User",
				role: "regular",
				emailAddress: "updated@test.com",
			});

			// Verify invalidateEntityLists was attempted
			expect(mocks.invalidateEntityLists).toHaveBeenCalled();

			// Verify warning was logged for the list cache error
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{ error: "Redis connection failed on list invalidation" },
				"Failed to invalidate user cache (non-fatal)",
			);
		});
	});
});
