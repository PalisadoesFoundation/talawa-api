import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { CurrentClient, GraphQLContext } from "~/src/graphql/context";
import { mutationDeletePostInputSchema } from "~/src/graphql/inputs/MutationDeletePostInput";
import { deletePostResolver } from "~/src/graphql/types/Mutation/deletePost";

interface DeletedPost {
	id: string;
	content: string;
}

interface FakeTx {
	delete: () => {
		where: () => {
			returning: () => Promise<DeletedPost[]>;
		};
	};
}

// Re-create the arguments schema used in the resolver
const mutationDeletePostArgumentsSchema = z.object({
	input: mutationDeletePostInputSchema,
});

// Helper to create a full mock GraphQLContext with dummy values
const createMockContext = (
	overrides: Partial<GraphQLContext> = {},
): GraphQLContext => {
	return {
		currentClient: {
			isAuthenticated: true,
			user: { id: "user1" },
		} as CurrentClient,
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				postsTable: { findFirst: vi.fn() },
			},
			transaction: vi.fn(),
		},
		minio: {
			client: { removeObjects: vi.fn(() => Promise.resolve()) },
			bucketName: "test-bucket",
		},
		envConfig: { API_BASE_URL: "http://localhost" },
		jwt: { sign: vi.fn() },
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		...overrides,
	} as GraphQLContext;
};

const testPostId = "123e4567-e89b-12d3-a456-426614174000";
const validArgs = { input: { id: testPostId } };

// Since the input must include an id, we “force” invalid args via a cast.
const invalidArgs = { input: {} } as unknown as z.infer<
	typeof mutationDeletePostArgumentsSchema
>;

describe("deletePostResolver", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = createMockContext();
	});

	it("should throw an unauthenticated error if the client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unauthenticated");
	});

	it("should throw an invalid_arguments error if the input arguments are invalid", async () => {
		await expect(
			deletePostResolver(null, invalidArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "invalid_arguments");
	});

	it("should throw an unauthenticated error if the current user is not found", async () => {
		// Simulate no user found by returning undefined.
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [],
			organization: { membershipsWhereOrganization: [] },
		});
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unauthenticated");
	});

	it("should throw an arguments_associated_resources_not_found error if the post is not found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty(
			"extensions.code",
			"arguments_associated_resources_not_found",
		);
	});

	it("should throw an unauthorized_action_on_arguments_associated_resources error for an unauthorized non-admin user", async () => {
		// Simulate a non-admin user and a post that the user is neither creator nor organization admin for.
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "user" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "someoneElse",
			attachmentsWherePost: [],
			organization: { membershipsWhereOrganization: [] },
		});
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty(
			"extensions.code",
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	it("should throw an unexpected error if the deletion returns no post", async () => {
		// Define a fake transaction that returns an empty array.
		const fakeTransaction = vi.fn(
			async (fn: (tx: FakeTx) => Promise<unknown>): Promise<unknown> => {
				const fakeTx: FakeTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([]), // Simulate no deleted post.
						}),
					}),
				};
				return await fn(fakeTx);
			},
		);
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [{ name: "file1" }],
			organization: { membershipsWhereOrganization: [] },
		});
		ctx.drizzleClient.transaction =
			fakeTransaction as unknown as typeof ctx.drizzleClient.transaction;
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unexpected");
	});

	it("should successfully delete a post for an admin user", async () => {
		const deletedPost: DeletedPost = { id: "post1", content: "some content" };
		const attachments = [{ name: "file1" }, { name: "file2" }];
		// Define a fake transaction that returns the deleted post.
		const fakeTransaction = vi.fn(
			async (fn: (tx: FakeTx) => Promise<unknown>): Promise<unknown> => {
				const fakeTx: FakeTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([deletedPost]),
						}),
					}),
				};
				return await fn(fakeTx);
			},
		);
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "someoneElse",
			attachmentsWherePost: attachments,
			organization: { membershipsWhereOrganization: [] },
		});
		ctx.drizzleClient.transaction =
			fakeTransaction as unknown as typeof ctx.drizzleClient.transaction;
		const removeObjectsSpy = vi.fn().mockResolvedValue(undefined);
		ctx.minio.client.removeObjects = removeObjectsSpy;
		const result = await deletePostResolver(null, validArgs, ctx);
		expect(result).toEqual(Object.assign(deletedPost, { attachments }));
		expect(removeObjectsSpy).toHaveBeenCalledWith(
			"test-bucket",
			attachments.map((att) => att.name),
		);
	});

	it("should throw an unexpected error if no deleted post is returned", async () => {
		const fakeTransaction = vi.fn(
			async (fn: (tx: FakeTx) => Promise<unknown>) => {
				const fakeTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([]),
						}),
					}),
				};
				return await fn(fakeTx);
			},
		);
		// Ensure that the query mocks return valid values.
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [{ name: "file1" }],
			organization: { membershipsWhereOrganization: [] },
		});
		ctx.drizzleClient.transaction =
			fakeTransaction as unknown as typeof ctx.drizzleClient.transaction;

		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unexpected");
	});

	it("should successfully delete a post for a non-admin user with organization admin membership", async () => {
		const deletedPost: DeletedPost = { id: "post1", content: "some content" };
		const attachments = [{ name: "file1" }];
		const fakeTransaction = vi.fn(
			async (fn: (tx: FakeTx) => Promise<unknown>): Promise<unknown> => {
				const fakeTx: FakeTx = {
					delete: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([deletedPost]),
						}),
					}),
				};
				return await fn(fakeTx);
			},
		);
		// Non-admin user scenario.
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "user" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "otherUser",
			attachmentsWherePost: attachments,
			organization: {
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
		ctx.drizzleClient.transaction =
			fakeTransaction as unknown as typeof ctx.drizzleClient.transaction;
		const removeObjectsSpy = vi.fn().mockResolvedValue(undefined);
		ctx.minio.client.removeObjects = removeObjectsSpy;
		const result = await deletePostResolver(null, validArgs, ctx);
		expect(result).toEqual(Object.assign(deletedPost, { attachments }));
		expect(removeObjectsSpy).toHaveBeenCalledWith(
			"test-bucket",
			attachments.map((att) => att.name),
		);
	});
	it("should delete the post, remove objects, and return the deleted post if user is admin", async () => {
		// This test covers the transaction block (around line 54) and removeObjects call (around line 66).
		ctx.drizzleClient.query.usersTable.findFirst = vi.fn().mockResolvedValue({
			role: "administrator",
		});
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user999",
			attachmentsWherePost: [{ name: "attachment1" }, { name: "attachment2" }],
			organization: { membershipsWhereOrganization: [] },
		});

		ctx.drizzleClient.transaction = vi.fn(async (cb) => {
			return cb({
				delete: () => ({
					where: () => ({
						returning: async () => [
							{ id: testPostId, content: "Deleted content" },
						],
					}),
				}),
			});
		});

		const result = await deletePostResolver(null, validArgs, ctx);

		expect(ctx.drizzleClient.transaction).toHaveBeenCalled();
		expect(ctx.minio.client.removeObjects).toHaveBeenCalledWith(
			ctx.minio.bucketName,
			["attachment1", "attachment2"],
		);
		expect(result.id).toBe(testPostId);
		expect(result.attachments).toHaveLength(2);
	});
});
