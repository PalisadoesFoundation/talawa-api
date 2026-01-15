/**
 * Unit Tests for updateCurrentUser Resolver - Cache Invalidation Logic
 *
 * PURPOSE: These unit tests specifically verify cache invalidation behavior
 * which cannot be easily asserted in integration tests. They complement the
 * comprehensive integration tests in updateCurrentUser.test.ts.
 *
 * Tests cover:
 * 1. Cache invalidation is called with correct arguments ("user" entity type and currentUserId)
 * 2. Graceful degradation when cache invalidation fails (mutation still succeeds)
 * 3. Cache invalidation runs after transaction commits (ordering)
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
					id: "current-user-id",
					name: "Updated User",
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

// Configure Drizzle Mock
mocks.drizzle.transaction.mockImplementation(
	async (cb: (tx: typeof mocks.tx) => Promise<unknown>) => {
		return await cb(mocks.tx);
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
		user: { id: "current-user-id" },
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

vi.mock("~/src/graphql/inputs/MutationUpdateCurrentUserInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdateCurrentUserInputSchema: z.object({
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
			maritalStatus: z.string().nullish(),
			mobilePhoneNumber: z.string().nullish(),
			name: z.string().min(1).max(256).optional(),
			natalSex: z.string().nullish(),
			naturalLanguageCode: z.string().nullish(),
			password: z.string().min(1).max(64).optional(),
			postalCode: z.string().min(1).max(32).nullish(),
			state: z.string().min(1).max(64).nullish(),
			workPhoneNumber: z.string().nullish(),
		}),
		MutationUpdateCurrentUserInput: "MutationUpdateCurrentUserInput",
	};
});

// Mock argon2 hash function
vi.mock("@node-rs/argon2", () => ({
	hash: vi.fn().mockResolvedValue("hashed-password"),
}));

import "~/src/graphql/types/Mutation/updateCurrentUser";

describe("updateCurrentUser Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updateCurrentUserCall = calls.find(
			(c: unknown[]) => c[0] === "updateCurrentUser",
		);
		if (updateCurrentUserCall) {
			// The resolver is passed in the field definition
			const fieldDef = updateCurrentUserCall[1]({
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

	describe("Cache invalidation is called with correct arguments", () => {
		it("should call invalidateEntity and invalidateEntityLists with correct args", async () => {
			const currentUserId = "current-user-id";

			// Current user exists
			mocks.drizzle.query.usersTable.findFirst.mockResolvedValueOnce({
				avatarName: null,
			});

			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: currentUserId,
					name: "Updated User",
					emailAddress: "updated@test.com",
				},
			]);

			const args = {
				input: {
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify invalidateEntity was called with correct arguments
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"user",
				currentUserId,
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

	describe("Cache invalidation error handling (graceful degradation)", () => {
		it("should succeed despite invalidateEntity throwing an error", async () => {
			const currentUserId = "current-user-id";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValueOnce({
				avatarName: null,
			});

			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: currentUserId,
					name: "Updated User",
					emailAddress: "updated@test.com",
				},
			]);

			// Make cache invalidation throw an error
			mocks.invalidateEntity.mockRejectedValueOnce(
				new Error("Redis connection failed"),
			);

			const args = {
				input: {
					name: "Updated Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded and returned the updated user
			expect(result).toEqual({
				id: currentUserId,
				name: "Updated User",
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

		it("should succeed despite invalidateEntityLists throwing an error", async () => {
			const currentUserId = "current-user-id";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValueOnce({
				avatarName: null,
			});

			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: currentUserId,
					name: "Updated User",
					emailAddress: "updated@test.com",
				},
			]);

			// invalidateEntity succeeds, invalidateEntityLists fails
			mocks.invalidateEntity.mockResolvedValueOnce(undefined);
			mocks.invalidateEntityLists.mockRejectedValueOnce(
				new Error("Redis timeout"),
			);

			const args = {
				input: {
					name: "Updated Name",
				},
			};

			// Resolver should succeed despite cache errors (graceful degradation)
			const result = await resolver(null, args, mockContext);

			// Verify the resolver succeeded
			expect(result).toEqual({
				id: currentUserId,
				name: "Updated User",
				emailAddress: "updated@test.com",
			});

			// Verify cache invalidation was attempted
			expect(mocks.invalidateEntityLists).toHaveBeenCalled();

			// Verify warning was logged for the cache error
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{ error: "Redis timeout" },
				"Failed to invalidate user cache (non-fatal)",
			);
		});
	});

	describe("Cache invalidation is executed after the DB transaction completes", () => {
		it("should call cache invalidation after transaction commits", async () => {
			const currentUserId = "current-user-id";
			const callOrder: string[] = [];

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValueOnce({
				avatarName: null,
			});

			// Track transaction commit
			mocks.drizzle.transaction.mockImplementationOnce(
				async (cb: (tx: typeof mocks.tx) => Promise<unknown>) => {
					const result = await cb(mocks.tx);
					callOrder.push("tx_commit");
					return result;
				},
			);

			mocks.tx.returning.mockImplementationOnce(async () => {
				callOrder.push("tx_returning");
				return [
					{
						id: currentUserId,
						name: "Updated User",
						emailAddress: "updated@test.com",
					},
				];
			});

			mocks.invalidateEntity.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntity");
			});

			mocks.invalidateEntityLists.mockImplementationOnce(async () => {
				callOrder.push("invalidateEntityLists");
			});

			const args = {
				input: {
					name: "Updated Name",
				},
			};

			await resolver(null, args, mockContext);

			// Verify all steps were executed
			expect(callOrder).toContain("tx_returning");
			expect(callOrder).toContain("tx_commit");
			expect(callOrder).toContain("invalidateEntity");
			expect(callOrder).toContain("invalidateEntityLists");

			// Verify order: tx.returning completes → transaction commits → cache invalidation
			expect(callOrder.indexOf("tx_returning")).toBeLessThan(
				callOrder.indexOf("tx_commit"),
			);

			// Assert invalidateEntity is called after transaction commit
			expect(callOrder.indexOf("tx_commit")).toBeLessThan(
				callOrder.indexOf("invalidateEntity"),
			);

			// Assert invalidateEntityLists is called after transaction commit
			expect(callOrder.indexOf("tx_commit")).toBeLessThan(
				callOrder.indexOf("invalidateEntityLists"),
			);
		});
	});
});
