import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { CurrentClient, GraphQLContext } from "~/src/graphql/context";
import { mutationDeletePostInputSchema } from "~/src/graphql/inputs/MutationDeletePostInput";
import { deletePostResolver } from "~/src/graphql/types/Mutation/deletePost";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/** Represents a successfully deleted post returned by the resolver */
interface DeletedPost {
	id: string;
	content: string;
}

/** Mock transaction interface for testing database operations */
interface FakeTx {
	delete: <T = DeletedPost>() => {
		where: () => {
			returning: () => Promise<T[]>;
		};
	};
}

/** Schema for validating mutation arguments, matching the resolver's expectations */
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

const invalidArgs = { input: {} } as unknown as z.infer<
	typeof mutationDeletePostArgumentsSchema
>;

function createFakeTransaction(
	returningData: unknown[],
	shouldFail = false,
): (fn: (tx: FakeTx) => Promise<unknown>) => Promise<unknown> {
	return vi.fn(
		async (fn: (tx: FakeTx) => Promise<unknown>): Promise<unknown> => {
			if (shouldFail) {
				throw new Error("Transaction failed");
			}
			const fakeTx: FakeTx = {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue(returningData),
					}),
				}),
			};
			return await fn(fakeTx);
		},
	);
}

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
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [{ name: "file1" }],
			organization: { membershipsWhereOrganization: [] },
		});

		ctx.drizzleClient.transaction = createFakeTransaction(
			[],
		) as unknown as typeof ctx.drizzleClient.transaction;

		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unexpected");
	});

	it("should successfully delete a post for an admin user", async () => {
		const deletedPost: DeletedPost = { id: "post1", content: "some content" };
		const attachments = [{ name: "file1" }, { name: "file2" }];

		ctx.drizzleClient.transaction = createFakeTransaction([
			deletedPost,
		]) as unknown as typeof ctx.drizzleClient.transaction;

		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "someoneElse",
			attachmentsWherePost: attachments,
			organization: { membershipsWhereOrganization: [] },
		});
		const removeObjectsSpy = vi.fn().mockResolvedValue(undefined);
		ctx.minio.client.removeObjects = removeObjectsSpy;
		const result = await deletePostResolver(null, validArgs, ctx);
		const expectedDeletedPost = { ...deletedPost, attachments };
		expect(result).toEqual(expectedDeletedPost);
		expect(removeObjectsSpy).toHaveBeenCalledWith(
			"test-bucket",
			attachments.map((att) => att.name),
		);
	});

	it("should successfully delete a post for a non-admin user with organization admin membership", async () => {
		const deletedPost: DeletedPost = { id: "post1", content: "some content" };
		const attachments = [{ name: "file1" }];

		ctx.drizzleClient.transaction = createFakeTransaction([
			deletedPost,
		]) as unknown as typeof ctx.drizzleClient.transaction;

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

		const removeObjectsSpy = vi.fn().mockResolvedValue(undefined);
		ctx.minio.client.removeObjects = removeObjectsSpy;

		const result = await deletePostResolver(null, validArgs, ctx);
		expect(result).toEqual(Object.assign(deletedPost, { attachments }));
		expect(removeObjectsSpy).toHaveBeenCalledWith(
			"test-bucket",
			attachments.map((att) => att.name),
		);
	});

	it("should call usersTable.findFirst with correct eq condition using currentUserId", async () => {
		const findFirstSpy = vi.fn().mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.usersTable.findFirst = findFirstSpy;

		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [],
			organization: { membershipsWhereOrganization: [] },
		});

		ctx.drizzleClient.transaction = createFakeTransaction([
			{ id: testPostId, content: "dummy content" },
		]) as unknown as typeof ctx.drizzleClient.transaction;

		await deletePostResolver(null, validArgs, ctx);

		expect(findFirstSpy).toHaveBeenCalled();

		expect(findFirstSpy.mock.calls.length).toBeGreaterThan(0);
		const firstCall = findFirstSpy.mock.calls[0];
		if (!firstCall) {
			throw new Error("Expected findFirst to be called at least once");
		}
		const optionsPassed = firstCall[0];
		expect(typeof optionsPassed.where).toBe("function");

		const fakeFields = { id: "user1" };
		const eqMock = vi.fn((a, b) => `eq(${a},${b})`);
		const fakeOperators = { eq: eqMock };

		const conditionResult = optionsPassed.where(fakeFields, fakeOperators);

		expect(eqMock).toHaveBeenCalledWith(
			fakeFields.id,
			ctx.currentClient.user?.id,
		);
		expect(conditionResult).toEqual("eq(user1,user1)");
	});

	it("should throw unauthorized error for non-admin user when organization membership is defined but not admin and post creator is not current user", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "user" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "otherUser",
			attachmentsWherePost: [],
			organization: {
				membershipsWhereOrganization: [{ role: "user" }],
			},
		});

		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty(
			"extensions.code",
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	it("should succeed on first delete and fail with 'unexpected' error on subsequent attempts due to race condition", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue({ role: "administrator" });
		ctx.drizzleClient.query.postsTable.findFirst = vi.fn().mockResolvedValue({
			creatorId: "user1",
			attachmentsWherePost: [],
			organization: { membershipsWhereOrganization: [] },
		});

		let firstCheck = true;
		ctx.drizzleClient.transaction = vi.fn(async (fn) => {
			if (firstCheck) {
				firstCheck = false;
				return { id: "post1" };
			}
			throw new TalawaGraphQLError({
				extensions: { code: "unexpected" },
				message: "Post already deleted",
			});
		}) as unknown as typeof ctx.drizzleClient.transaction;

		await expect(
			deletePostResolver(null, validArgs, ctx),
		).resolves.toBeDefined();

		await expect(deletePostResolver(null, validArgs, ctx)).rejects.toThrow(
			"Post already deleted",
		);
		await expect(
			deletePostResolver(null, validArgs, ctx),
		).rejects.toHaveProperty("extensions.code", "unexpected");
	});
});
