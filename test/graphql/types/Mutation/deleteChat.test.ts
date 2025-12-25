import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteChatResolver } from "~/src/graphql/types/Mutation/deleteChat";

vi.mock("~/src/graphql/builder", () => ({
	builder: {
		mutationField: vi.fn(),
		inputRef: vi.fn(() => ({
			implement: vi.fn(),
		})),
		objectRef: vi.fn(() => ({
			implement: vi.fn(),
		})),
	},
}));

function createMockContext(
	overrides: Partial<GraphQLContext> = {},
): GraphQLContext {
	return {
		currentClient: {
			isAuthenticated: true,
			user: { id: "user-id" },
		},
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				chatsTable: { findFirst: vi.fn() },
			},
			transaction: vi.fn(),
		},
		minio: {
			bucketName: "talawa",
			client: { removeObject: vi.fn() },
		},
		log: {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		},
		...overrides,
	} as GraphQLContext;
}

/**
 * Invoke where/with callbacks present on a drizzle-like query object so
 * function bodies defined in `deleteChat.ts` are executed during tests.
 */

interface MockQuery {
	where?: unknown;
	with?: Record<string, MockQuery>;
}

function executeQueryBuilders(query: unknown) {
	if (!query || typeof query !== "object") return;
	const q = query as MockQuery;

	if (typeof q.where === "function") {
		// Provide minimal `fields` and `operators` objects expected by the lambdas.

		q.where(
			{ id: "user-id", memberId: "user-id" },
			{ eq: (_a: unknown, _b: unknown) => true },
		);
	}

	if (q.with && typeof q.with === "object") {
		for (const key of Object.keys(q.with)) {
			const item = q.with[key];
			if (item && typeof item.where === "function") {
				item.where(
					{ id: "user-id", memberId: "user-id" },
					{ eq: (_a: unknown, _b: unknown) => true },
				);
			}

			// Support nested `with` blocks
			if (item?.with && typeof item.with === "object") {
				for (const nestedKey of Object.keys(item.with)) {
					const nested = item.with[nestedKey];
					if (nested && typeof nested.where === "function") {
						nested.where(
							{ id: "user-id", memberId: "user-id" },
							{ eq: (_a: unknown, _b: unknown) => true },
						);
					}
				}
			}
		}
	}
}

const validArgs = {
	// Use a syntactically valid UUID so zod's UUID checks pass when using the
	// production zod schema in `deleteChat.ts`.
	input: { id: "00000000-0000-4000-8000-000000000000" },
};

describe("deleteChatResolver", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = createMockContext();
	});

	it("throws unauthenticated if client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws invalid_arguments for invalid input", async () => {
		await expect(
			// @ts-expect-error Testing invalid input
			deleteChatResolver({}, { input: {} }, ctx),
		).rejects.toMatchObject({
			extensions: { code: "invalid_arguments" },
		});
	});

	it("throws unauthenticated if current user not found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return undefined;
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return {
					avatarName: null,
					chatMembershipsWhereChat: [],
					organization: { membershipsWhereOrganization: [] },
				};
			});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws arguments_associated_resources_not_found if chat does not exist", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return { role: "administrator" };
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return undefined;
			});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toMatchObject({
			extensions: {
				code: "arguments_associated_resources_not_found",
			},
		});
	});

	it("throws unauthorized when user is not admin at any level", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return { role: "member" };
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return {
					avatarName: null,
					chatMembershipsWhereChat: [{ role: "member" }],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }],
					},
				};
			});

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action_on_arguments_associated_resources",
			},
		});
	});

	it("throws unexpected when delete returns undefined", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return { role: "administrator" };
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return {
					avatarName: null,
					chatMembershipsWhereChat: [],
					organization: { membershipsWhereOrganization: [] },
				};
			});

		ctx.drizzleClient.transaction = vi.fn(async (cb) =>
			cb({
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([undefined]),
					}),
				}),
			}),
		);

		await expect(deleteChatResolver({}, validArgs, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
	});

	it("successfully deletes chat without avatar", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return { role: "administrator" };
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return {
					avatarName: null,
					chatMembershipsWhereChat: [],
					organization: { membershipsWhereOrganization: [] },
				};
			});

		ctx.drizzleClient.transaction = vi.fn(async (cb) =>
			cb({
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: "chat-id" }]),
					}),
				}),
			}),
		);

		const result = await deleteChatResolver({}, validArgs, ctx);
		expect(result).toEqual({ id: "chat-id" });
	});

	it("removes avatar from MinIO when avatar exists", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return { role: "administrator" };
			});

		ctx.drizzleClient.query.chatsTable.findFirst = vi
			.fn()
			.mockImplementation(async (query) => {
				executeQueryBuilders(query);
				return {
					avatarName: "avatar.png",
					chatMembershipsWhereChat: [],
					organization: { membershipsWhereOrganization: [] },
				};
			});

		ctx.drizzleClient.transaction = vi.fn(async (cb) =>
			cb({
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: "chat-id" }]),
					}),
				}),
			}),
		);

		const result = await deleteChatResolver({}, validArgs, ctx);

		expect(ctx.minio.client.removeObject).toHaveBeenCalledWith(
			"talawa",
			"avatar.png",
		);
		expect(result.id).toBe("chat-id");
	});

	it("executes module-level builder field for coverage", () => {
		const mockMutationField = builder.mutationField as Mock;
		expect(mockMutationField).toHaveBeenCalled();

		// Find the call for "deleteChat"
		const call = mockMutationField.mock.calls.find(
			(c: unknown[]) => c[0] === "deleteChat",
		);

		if (!call) throw new Error("Call not found");
		const callback = call[1];
		const t = {
			field: vi.fn(),
			arg: vi.fn(),
		};

		callback(t);
		expect(t.field).toHaveBeenCalled();
	});
});
