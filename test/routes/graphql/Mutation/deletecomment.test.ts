import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteCommentResolver } from "~/src/graphql/types/Mutation/deleteComment";

const validUuid = "11111111-1111-1111-1111-111111111111";
const validArgs = { input: { id: validUuid } };

/**
 * Creates a mock GraphQLContext for testing.
 * @param overrides - Partial context to override default values
 * @returns GraphQLContext with mocked functionality
 */

function createMockContext(
	overrides: Partial<Required<GraphQLContext>> = {},
): GraphQLContext {
	return {
		currentClient: {
			isAuthenticated: true,
			user: { id: "current-user-id" },
		},
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				commentsTable: { findFirst: vi.fn() },
			},
			delete: vi.fn(),
			update: vi.fn(),
			transaction: vi.fn(),
		},
		minio: {
			client: { removeObjects: vi.fn(() => Promise.resolve()) },
			bucketName: "talawa",
		},
		envConfig: { API_BASE_URL: "http://localhost" },
		jwt: { sign: vi.fn() },
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		pubsub: { publish: vi.fn() },
		...overrides,
	} as GraphQLContext;
}

// --- Helper: Mock usersTable.findFirst ---
interface User {
	id: string;
	role: string;
}

function mockUsersTableFindFirst(
	ctx: GraphQLContext,
	returnValue: Partial<User> = {},
) {
	ctx.drizzleClient.query.usersTable.findFirst = vi.fn().mockResolvedValue({
		id: "current-user-id",
		role: "user",
		...returnValue,
	});
}

interface CommentsFindFirstConfig {
	columns?: {
		creatorId?: boolean;
	};
	where?: (
		fields: { id: string },
		operators: { eq: (a: string, b: string) => boolean },
	) => boolean;
	with?: {
		post?: {
			columns?: {
				pinnedAt?: boolean;
			};
			with?: {
				organization?: {
					columns?: {
						countryCode?: boolean;
					};
					with?: {
						membershipsWhereOrganization?: {
							columns?: {
								role?: boolean;
							};
							where?: (
								fields: { memberId: string },
								operators: { eq: (a: string, b: string) => boolean },
							) => boolean;
						};
					};
				};
			};
		};
	};
}

// --- Helper: Mock commentsTable.findFirst ---
interface Comment {
	id: string;
	creatorId: string;
	post: {
		organization: {
			membershipsWhereOrganization: { role: string }[];
		};
		pinnedAt?: Date | null;
	};
}

type ExtendedComment = {
	id: string;
	body: string;
	creatorId: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	postId: string;
	post?: {
		pinnedAt: Date | null;
		organization: {
			membershipsWhereOrganization: { role: string }[];
		};
	};
};

function mockCommentsTableFindFirst(
	ctx: GraphQLContext,
	returnValue: Partial<Comment> = {},
) {
	ctx.drizzleClient.query.commentsTable.findFirst = vi.fn().mockResolvedValue({
		creatorId: "other-user-id",
		post: {
			organization: { membershipsWhereOrganization: [] },
			pinnedAt: null,
		},
		...returnValue,
	});
}

// --- Helper: Create a fake delete chain for delete operations ---
function createFakeDeleteChain(returningData: unknown[]): {
	where: () => { returning: () => Promise<unknown[]> };
} {
	return {
		where: vi.fn().mockReturnValue({
			returning: vi.fn().mockResolvedValue(returningData),
		}),
	};
}

describe("deleteCommentResolver", () => {
	let ctx: GraphQLContext;
	beforeEach(() => {
		ctx = createMockContext();
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(
			deleteCommentResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws invalid_arguments error when input is invalid", async () => {
		await expect(
			deleteCommentResolver(
				{},
				{
					input: {
						id: "",
					},
				},
				ctx,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "invalid_arguments" }),
			}),
		);
	});

	it("throws unauthenticated error when currentUser is undefined", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		mockCommentsTableFindFirst(ctx, {
			creatorId: "other-user-id",
			post: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				pinnedAt: null,
			},
		});
		await expect(
			deleteCommentResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws arguments_associated_resources_not_found error when comment is not found", async () => {
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		ctx.drizzleClient.query.commentsTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		await expect(
			deleteCommentResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	it("throws unauthorized error when current user is not admin and not authorized", async () => {
		// Set current user as non-admin.
		mockUsersTableFindFirst(ctx, { role: "user" });
		// Simulate a comment not created by the current user and org membership is non-admin.
		mockCommentsTableFindFirst(ctx, {
			creatorId: "other-user-id",
			post: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
				pinnedAt: null,
			},
		});
		await expect(
			deleteCommentResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws unexpected error when deletion returns undefined", async () => {
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		mockCommentsTableFindFirst(ctx, {
			creatorId: "current-user-id",
			post: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				pinnedAt: null,
			},
		});
		ctx.drizzleClient.delete = vi
			.fn()
			.mockReturnValue(createFakeDeleteChain([]));
		await expect(
			deleteCommentResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);
	});

	it("calls commentsTable.findFirst with correct configuration (covering lines 62 & 70)", async () => {
		mockUsersTableFindFirst(ctx, { role: "administrator" });

		const commentFindFirstSpy = vi
			.spyOn(ctx.drizzleClient.query.commentsTable, "findFirst")
			.mockResolvedValue({
				id: "comment-id-123",
				body: "some body",
				createdAt: new Date(),
				updatedAt: null,
				creatorId: "current-user-id",
				postId: "post-id-123",
				post: {
					pinnedAt: null,
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			} as ExtendedComment);

		ctx.drizzleClient.delete = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([
					{
						id: validUuid,
						creatorId: "current-user-id",
						post: {
							organization: {
								membershipsWhereOrganization: [{ role: "administrator" }],
							},
							pinnedAt: null,
						},
					},
				]),
			}),
		});

		await deleteCommentResolver({}, validArgs, ctx);
		expect(commentFindFirstSpy).toHaveBeenCalledTimes(1);
		expect(commentFindFirstSpy.mock.calls.length).toBeGreaterThan(0);
		const config = commentFindFirstSpy.mock
			.calls[0]?.[0] as CommentsFindFirstConfig;

		expect(config.columns).toEqual({ creatorId: true });
		expect(typeof config.where).toBe("function");
		if (config.where) {
			const eqFn = (a: string, b: string) => a === b;
			const whereResult = config.where({ id: validUuid }, { eq: eqFn });
			expect(whereResult).toBe(true);
		}

		expect(config.with?.post?.columns).toEqual({ pinnedAt: true });
		expect(config.with?.post?.with?.organization?.columns).toEqual({
			countryCode: true,
		});
		expect(
			config.with?.post?.with?.organization?.with?.membershipsWhereOrganization
				?.columns,
		).toEqual({ role: true });
		expect(
			typeof config.with?.post?.with?.organization?.with
				?.membershipsWhereOrganization?.where,
		).toBe("function");

		const membershipWhereFn =
			config.with?.post?.with?.organization?.with?.membershipsWhereOrganization
				?.where;
		if (membershipWhereFn) {
			const eqFn = (a: string, b: string) => a === b;
			const membershipResult = membershipWhereFn(
				{ memberId: "current-user-id" },
				{ eq: eqFn },
			);
			expect(membershipResult).toBe(true);
		}
	});

	it("successfully deletes and returns the comment", async () => {
		const deletedComment: Comment & { id: string } = {
			id: validUuid,
			creatorId: "current-user-id",
			post: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				pinnedAt: null,
			},
		};
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		mockCommentsTableFindFirst(ctx, {
			creatorId: "current-user-id",
			post: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				pinnedAt: null,
			},
		});
		ctx.drizzleClient.delete = vi
			.fn()
			.mockReturnValue(createFakeDeleteChain([deletedComment]));
		const result = await deleteCommentResolver({}, validArgs, ctx);
		expect(result).toEqual(deletedComment);
	});
});

describe("GraphQL schema wiring", () => {
	let mutationFieldSpy: ReturnType<typeof vi.spyOn>;
	let localBuilder: typeof import("~/src/graphql/builder").builder;
	let localDeleteResolver: typeof deleteCommentResolver;

	beforeEach(async () => {
		vi.resetModules();
		const builderModule = await import("~/src/graphql/builder");
		localBuilder = builderModule.builder;
		mutationFieldSpy = vi.spyOn(localBuilder, "mutationField");

		const mod = await import("~/src/graphql/types/Mutation/deleteComment");
		localDeleteResolver = mod.deleteCommentResolver;
	});

	afterEach(() => {
		mutationFieldSpy.mockRestore();
	});

	it("should register deleteComment mutation correctly", () => {
		expect(mutationFieldSpy).toHaveBeenCalledWith(
			"deleteComment",
			expect.any(Function),
		);
		const calls = mutationFieldSpy.mock.calls.filter(
			(call) => call[0] === "deleteComment",
		);
		expect(calls.length).toBeGreaterThan(0);
		if (calls[0] === undefined)
			throw new Error("No calls found for deleteComment mutation");
		type BuilderCallback = (t: {
			field: (config: unknown) => unknown;
			arg: (config: unknown) => unknown;
		}) => unknown;
		const callback = calls[0][1] as BuilderCallback;
		const dummyT = {
			field: vi.fn().mockImplementation((config) => config),
			arg: vi.fn().mockImplementation((config) => config),
		};
		const fieldConfig = callback(dummyT) as { args: Record<string, unknown> };
		expect(dummyT.field).toHaveBeenCalledWith(
			expect.objectContaining({
				type: expect.anything(),
				description: "Mutation field to delete a comment.",
				args: expect.any(Object),
				resolve: localDeleteResolver,
			}),
		);
		expect(fieldConfig.args).toHaveProperty("input");
	});
});
