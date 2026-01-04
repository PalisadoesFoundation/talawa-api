/**
 * Unit tests for deleteChatResolver edge cases using mocked context.
 * These tests cover:
 * - Lines 92-97: currentUser undefined check
 * - Line 121: chat admin authorization branch
 * - Lines 143-148: race condition on delete
 */
import { expect, suite, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteChatResolver } from "~/src/graphql/types/Mutation/deleteChat";

function createMockContext(
	overrides: Partial<GraphQLContext> = {},
): GraphQLContext {
	return {
		currentClient: {
			isAuthenticated: true,
			user: { id: "11111111-1111-1111-1111-111111111111" },
		},
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				chatsTable: { findFirst: vi.fn() },
			},
			delete: vi.fn(),
			transaction: vi.fn(),
		},
		minio: {
			client: { removeObject: vi.fn(() => Promise.resolve()) },
			bucketName: "talawa",
		},
		envConfig: { API_BASE_URL: "http://localhost" },
		jwt: { sign: vi.fn() },
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		pubsub: { publish: vi.fn() },
		...overrides,
	} as GraphQLContext;
}

function mockUsersTableFindFirst(
	ctx: GraphQLContext,
	returnValue: { role?: string; id?: string } | undefined,
): void {
	ctx.drizzleClient.query.usersTable.findFirst = vi
		.fn()
		.mockResolvedValue(returnValue);
}

function mockChatsTableFindFirst(
	ctx: GraphQLContext,
	returnValue:
		| {
				avatarName?: string | null;
				chatMembershipsWhereChat?: { role: string }[];
				organization?: {
					membershipsWhereOrganization?: { role: string }[];
				};
		  }
		| undefined,
): void {
	ctx.drizzleClient.query.chatsTable.findFirst = vi
		.fn()
		.mockResolvedValue(returnValue);
}

const validArgs = { input: { id: "11111111-1111-1111-1111-111111111111" } };

suite("deleteChatResolver unit tests for edge cases", () => {
	test("throws unauthenticated error when currentUser is undefined (lines 92-97)", async () => {
		const ctx = createMockContext();
		// User authenticated but not found in DB
		mockUsersTableFindFirst(ctx, undefined);
		mockChatsTableFindFirst(ctx, {
			avatarName: null,
			chatMembershipsWhereChat: [],
			organization: { membershipsWhereOrganization: [] },
		});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	test("throws unexpected error when delete returns undefined - race condition (lines 143-148)", async () => {
		const ctx = createMockContext();
		mockUsersTableFindFirst(ctx, {
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});
		mockChatsTableFindFirst(ctx, {
			avatarName: null,
			chatMembershipsWhereChat: [],
			organization: { membershipsWhereOrganization: [] },
		});

		// Mock transaction that returns undefined for deleted chat (race condition)
		ctx.drizzleClient.transaction = vi.fn().mockImplementation(async (cb) => {
			const tx = {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]),
					}),
				}),
			};
			return cb(tx);
		});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);
	});

	test("allows chat admin (non-org-admin) to delete chat - line 121 coverage", async () => {
		const ctx = createMockContext();
		// Regular user role (not system administrator)
		mockUsersTableFindFirst(ctx, {
			role: "regular",
			id: "11111111-1111-1111-1111-111111111111",
		});
		// Regular org member but chat administrator
		mockChatsTableFindFirst(ctx, {
			avatarName: null,
			chatMembershipsWhereChat: [{ role: "administrator" }],
			organization: { membershipsWhereOrganization: [{ role: "regular" }] },
		});

		const deletedChat = {
			id: validArgs.input.id,
			name: "TestChat",
			avatarName: null,
		};

		// Mock transaction that returns the deleted chat
		ctx.drizzleClient.transaction = vi.fn().mockImplementation(async (cb) => {
			const tx = {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([deletedChat]),
					}),
				}),
			};
			return cb(tx);
		});

		const result = await deleteChatResolver({}, validArgs, ctx);
		expect(result).toEqual(deletedChat);
	});

	test("throws unauthorized when regular org member is also regular chat member (line 121 true branch)", async () => {
		const ctx = createMockContext();
		// Regular user role (not system administrator)
		mockUsersTableFindFirst(ctx, {
			role: "regular",
			id: "11111111-1111-1111-1111-111111111111",
		});
		// Regular org member AND regular chat member (not admin in either)
		mockChatsTableFindFirst(ctx, {
			avatarName: null,
			chatMembershipsWhereChat: [{ role: "regular" }],
			organization: { membershipsWhereOrganization: [{ role: "regular" }] },
		});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("deletes chat and removes avatar from minio when avatar exists", async () => {
		const ctx = createMockContext();
		mockUsersTableFindFirst(ctx, {
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});

		const avatarName = "test-avatar.png";
		mockChatsTableFindFirst(ctx, {
			avatarName,
			chatMembershipsWhereChat: [],
			organization: { membershipsWhereOrganization: [] },
		});

		const deletedChat = {
			id: validArgs.input.id,
			name: "TestChat",
			avatarName,
		};

		ctx.drizzleClient.transaction = vi.fn().mockImplementation(async (cb) => {
			const tx = {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([deletedChat]),
					}),
				}),
			};
			return cb(tx);
		});

		const result = await deleteChatResolver({}, validArgs, ctx);
		expect(result).toEqual(deletedChat);
		expect(ctx.minio.client.removeObject).toHaveBeenCalledWith(
			ctx.minio.bucketName,
			avatarName,
		);
	});
});
