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
		extensions: Record<string, unknown>;
		constructor(options: {
			message?: string;
			extensions: Record<string, unknown>;
		}) {
			super(options.message ?? "TalawaGraphQLError");
			this.extensions = options.extensions;
		}
	},
}));

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
}));

vi.mock("~/src/utilities/getKeyPathsWithNonUndefinedValues", () => ({
	getKeyPathsWithNonUndefinedValues: () => [],
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
			delete: vi.fn(),
			insert: vi.fn(),
			set: vi.fn(),
			where: vi.fn(),
			values: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "post-1",
					caption: "Updated Post",
					body: "Body content",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				postsTable: {
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
mocks.tx.update.mockReturnValue(mocks.tx);
mocks.tx.delete.mockReturnValue(mocks.tx);
mocks.tx.insert.mockReturnValue(mocks.tx);
mocks.tx.set.mockReturnValue(mocks.tx);
mocks.tx.where.mockReturnValue(mocks.tx);
mocks.tx.values.mockReturnValue(mocks.tx);

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

// Mock the Post type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Post/Post", () => ({
	Post: "PostType",
}));

vi.mock("~/src/graphql/inputs/MutationUpdatePostInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdatePostInputSchema: z.object({
			id: z.string().uuid(),
			caption: z.string().optional(),
			body: z.string().optional(),
			isPinned: z.boolean().optional(),
			attachment: z.any().optional(),
		}),
		MutationUpdatePostInput: "MutationUpdatePostInput",
	};
});

import "~/src/graphql/types/Mutation/updatePost";

describe("updatePost Resolver Cache Invalidation Tests", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updatePostCall = calls.find((c: unknown[]) => c[0] === "updatePost");
		if (updatePostCall) {
			// The resolver is passed in the field definition
			const fieldDef = updatePostCall[1]({
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

	describe("cache invalidation when uploading a new attachment", () => {
		it("should call invalidateEntity and invalidateEntityLists when uploading a new attachment", async () => {
			const postId = "01234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning
				.mockResolvedValueOnce([
					{
						id: postId,
						caption: "Updated Post",
						body: "Body",
						pinnedAt: null,
						organizationId: "org-1",
					},
				])
				.mockResolvedValueOnce([
					{
						id: "attachment-id",
						name: "test.png",
						mimeType: "image/png",
						postId: postId,
						objectName: "test-object",
						fileHash: "hash",
					},
				]);

			const args = {
				input: {
					id: postId,
					caption: "Updated caption",
					attachment: {
						mimetype: "image/png",
						filename: "test.png",
						createReadStream: vi.fn().mockReturnValue("stream"),
					},
				},
			};

			await resolver(null, args, mockContext);

			// Verify cache invalidation was called
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
				postId,
			);
			expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
			);
		});
	});

	describe("cache invalidation when setting attachment to null (explicit removal)", () => {
		it("should call invalidateEntity and invalidateEntityLists when removing attachment", async () => {
			const postId = "11234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [
					{
						id: "old-attachment",
						objectName: "old-object",
						name: "old.png",
					},
				],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: postId,
					caption: "Updated Post",
					body: "Body",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]);

			const args = {
				input: {
					id: postId,
					caption: "Updated caption",
					attachment: null, // Explicit removal
				},
			};

			await resolver(null, args, mockContext);

			// Verify cache invalidation was called
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
				postId,
			);
			expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
			);
		});
	});

	describe("cache invalidation when updating other fields without changing attachments", () => {
		it("should call invalidateEntity and invalidateEntityLists when updating only post fields", async () => {
			const postId = "21234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [
					{
						id: "existing-attachment",
						objectName: "existing-object",
						name: "existing.png",
					},
				],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: postId,
					caption: "Updated Post",
					body: "Updated Body",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]);

			const args = {
				input: {
					id: postId,
					caption: "Updated caption only",
					body: "Updated body only",
					// No attachment field - should keep existing attachments
				},
			};

			await resolver(null, args, mockContext);

			// Verify cache invalidation was called
			expect(mocks.invalidateEntity).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
				postId,
			);
			expect(mocks.invalidateEntityLists).toHaveBeenCalledWith(
				mockContext.cache,
				"post",
			);
		});
	});

	describe("cache invalidation order", () => {
		it("should call invalidateEntity before invalidateEntityLists", async () => {
			const postId = "31234567-89ab-cdef-0123-456789abcdef";
			const callOrder: string[] = [];

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: postId,
					caption: "Post",
					body: "Body",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]);

			mocks.invalidateEntity.mockImplementation(async () => {
				callOrder.push("invalidateEntity");
			});
			mocks.invalidateEntityLists.mockImplementation(async () => {
				callOrder.push("invalidateEntityLists");
			});

			const args = {
				input: {
					id: postId,
					caption: "Updated",
				},
			};

			await resolver(null, args, mockContext);

			// Verify order: entity invalidation before list invalidation
			expect(callOrder).toEqual(["invalidateEntity", "invalidateEntityLists"]);
		});

		it("should execute cache invalidation after DB transaction commits", async () => {
			const postId = "61234567-89ab-cdef-0123-456789abcdef";
			const callOrder: string[] = [];

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			// Track when transaction commit happens
			mocks.tx.returning.mockImplementation(async () => {
				callOrder.push("tx_commit");
				return [
					{
						id: postId,
						caption: "Updated Post",
						body: "Body",
						pinnedAt: null,
						organizationId: "org-1",
					},
				];
			});

			// Track when cache invalidation happens
			mocks.invalidateEntity.mockImplementation(async () => {
				callOrder.push("invalidateEntity");
			});
			mocks.invalidateEntityLists.mockImplementation(async () => {
				callOrder.push("invalidateEntityLists");
			});

			const args = {
				input: {
					id: postId,
					caption: "Updated",
				},
			};

			await resolver(null, args, mockContext);

			// Verify order: DB transaction commits before cache invalidation
			expect(callOrder).toEqual([
				"tx_commit",
				"invalidateEntity",
				"invalidateEntityLists",
			]);

			// Extra assertions to confirm invalidation ran after commit
			const txCommitIndex = callOrder.indexOf("tx_commit");
			const invalidateEntityIndex = callOrder.indexOf("invalidateEntity");
			const invalidateEntityListsIndex = callOrder.indexOf(
				"invalidateEntityLists",
			);

			expect(txCommitIndex).toBeLessThan(invalidateEntityIndex);
			expect(txCommitIndex).toBeLessThan(invalidateEntityListsIndex);
		});
	});

	describe("graceful degradation on cache errors", () => {
		it("should succeed despite invalidateEntity throwing an error", async () => {
			const postId = "41234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: postId,
					caption: "Updated Post",
					body: "Body",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]);

			// Make cache invalidation throw an error
			mocks.invalidateEntity.mockRejectedValueOnce(
				new Error("Redis unavailable"),
			);

			const args = {
				input: {
					id: postId,
					caption: "Updated",
				},
			};

			// Resolver should succeed despite cache errors
			const result = await resolver(null, args, mockContext);

			expect(result).toBeDefined();
			expect(mocks.invalidateEntity).toHaveBeenCalled();
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{ error: expect.any(Error), postId },
				"Failed to invalidate post entity cache (non-fatal)",
			);
		});

		it("should succeed despite invalidateEntityLists throwing an error", async () => {
			const postId = "51234567-89ab-cdef-0123-456789abcdef";

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.postsTable.findFirst.mockResolvedValue({
				id: postId,
				pinnedAt: null,
				creatorId: "admin-id",
				attachmentsWherePost: [],
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});
			mocks.tx.returning.mockResolvedValueOnce([
				{
					id: postId,
					caption: "Updated Post",
					body: "Body",
					pinnedAt: null,
					organizationId: "org-1",
				},
			]);

			// invalidateEntity succeeds, invalidateEntityLists fails
			mocks.invalidateEntity.mockResolvedValueOnce(undefined);
			mocks.invalidateEntityLists.mockRejectedValueOnce(
				new Error("Redis timeout"),
			);

			const args = {
				input: {
					id: postId,
					caption: "Updated",
				},
			};

			// Resolver should succeed despite cache errors
			const result = await resolver(null, args, mockContext);

			expect(result).toBeDefined();
			expect(mocks.invalidateEntityLists).toHaveBeenCalled();
			expect(mockContext.log.warn).toHaveBeenCalledWith(
				{ error: expect.any(Error), postId },
				"Failed to invalidate post list cache (non-fatal)",
			);
		});
	});
});
