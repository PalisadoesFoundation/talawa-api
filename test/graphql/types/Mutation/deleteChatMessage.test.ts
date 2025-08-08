import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteChatMessageResolver } from "~/src/graphql/types/Mutation/deleteChatMessage";

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
				chatMessagesTable: { findFirst: vi.fn() },
			},
			// For delete operations, we use transaction; update and delete methods are provided if needed.
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
): void {
	ctx.drizzleClient.query.usersTable.findFirst = vi.fn().mockResolvedValue({
		role: "user",
		id: "11111111-1111-1111-1111-111111111111",
		...returnValue,
	});
}

interface ChatMessage {
	id: string;
	creatorId: string;
	body: string;
	chat: {
		organization: { membershipsWhereOrganization: { role: string }[] };
		chatMembershipsWhereChat: { role: string }[];
	};
}

interface TestChatMessage extends ChatMessage {
	chatId: string;
}

function mockChatMessagesTableFindFirst(
	ctx: GraphQLContext,
	returnValue: Partial<ChatMessage> = {},
): void {
	ctx.drizzleClient.query.chatMessagesTable.findFirst = vi
		.fn()
		.mockResolvedValue({
			creatorId: "22222222-2222-2222-2222-222222222222",
			chat: {
				organization: { membershipsWhereOrganization: [] },
				chatMembershipsWhereChat: [],
			},
			...returnValue,
		});
}

function createFakeDeleteChain(returningData: unknown[]): {
	where: () => { returning: () => Promise<unknown[]> };
} {
	return {
		where: vi.fn().mockReturnValue({
			returning: vi.fn().mockResolvedValue(returningData),
		}),
	};
}

interface FindFirstParams {
	with?: {
		chat?: {
			with?: {
				organization?: {
					with?: {
						membershipsWhereOrganization?: {
							where: (
								fields: { memberId: string },
								operators: { eq: (value: string, expected: string) => boolean },
							) => boolean;
						};
					};
				};
			};
		};
	};
}

const validArgs = { input: { id: "11111111-1111-1111-1111-111111111111" } };

describe("deleteChatMessageResolver", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = createMockContext();
	});

	it("throws an unauthenticated error when the client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws an arguments_associated_resources_not_found error if chat message is not found", async () => {
		mockUsersTableFindFirst(ctx, { role: "user" });
		ctx.drizzleClient.query.chatMessagesTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	it("throws an unauthorized error if the current user is not allowed to delete the chat message", async () => {
		mockUsersTableFindFirst(ctx, { role: "user" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "someOtherUserId",
			chat: {
				organization: { membershipsWhereOrganization: [] },
				chatMembershipsWhereChat: [],
			},
		});
		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unexpected error if the deletion returns undefined", async () => {
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		ctx.drizzleClient.delete = vi
			.fn()
			.mockReturnValue(createFakeDeleteChain([]));

		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);
	});

	it("successfully deletes and returns the chat message", async () => {
		const deletedMessage: TestChatMessage = {
			id: "11111111-1111-1111-1111-111111111111",
			creatorId: "11111111-1111-1111-1111-111111111111",
			body: "Deleted message body",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
			chatId: "chat-123",
		};
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});
		ctx.drizzleClient.delete = vi
			.fn()
			.mockReturnValue(createFakeDeleteChain([deletedMessage]));

		const publishSpy = vi.spyOn(ctx.pubsub, "publish");

		const result = await deleteChatMessageResolver({}, validArgs, ctx);
		expect(result).toEqual(deletedMessage);
		expect(publishSpy).toHaveBeenCalledWith({
			payload: deletedMessage,
			topic: `chats.${deletedMessage.chatId}:chat_messages::create`,
		});
	});

	it("throws an invalid_arguments error when provided invalid input", async () => {
		await expect(
			deleteChatMessageResolver(
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

	it("throws an unauthenticated error when currentUser is undefined", async () => {
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValue(undefined);
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});
		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("allows a non-admin user to delete their own message", async () => {
		mockUsersTableFindFirst(ctx, { role: "user" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: ctx.currentClient.user?.id,
			chat: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});
		ctx.drizzleClient.delete = vi.fn().mockReturnValue(
			createFakeDeleteChain([
				{
					id: validArgs.input.id,
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					body: "Creator's own message",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "member" }],
						},
						chatMembershipsWhereChat: [{ role: "member" }],
					},
					chatId: "chat-123",
				},
			]),
		);

		const publishSpy = vi.spyOn(ctx.pubsub, "publish");
		const result = await deleteChatMessageResolver({}, validArgs, ctx);

		expect(result).toEqual(
			expect.objectContaining({
				creatorId: ctx.currentClient.user?.id ?? "unknown",
			}),
		);
		expect(publishSpy).toHaveBeenCalled();
	});

	it("calls usersTable.findFirst where lambda with correct user id", async () => {
		const eqSpy = vi.fn((value, expected) => value === expected);
		(ctx.drizzleClient.query.usersTable.findFirst as unknown as (args: {
			where: (
				fields: { id: string },
				operators: { eq: (value: string, expected: string) => boolean },
			) => boolean;
		}) => Promise<Partial<User>>) = vi.fn(({ where }) => {
			const dummyFields = { id: "dummyUserId" };
			where(dummyFields, { eq: eqSpy });
			return Promise.resolve({
				role: "administrator",
				id: ctx.currentClient.user?.id ?? "unknown",
			});
		});

		mockChatMessagesTableFindFirst(ctx, {
			creatorId: ctx.currentClient.user?.id ?? "unknown",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "administrator" }],
			},
		});
		ctx.drizzleClient.delete = vi.fn().mockReturnValue(
			createFakeDeleteChain([
				{
					id: "dummy",
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					body: "dummy",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
					chatId: "dummy-chat",
				},
			]),
		);

		await deleteChatMessageResolver({}, validArgs, ctx);
		expect(eqSpy).toHaveBeenCalledWith(
			"dummyUserId",
			ctx.currentClient.user?.id ?? "unknown",
		);
	});

	it("calls chatMessagesTable.findFirst top-level where lambda with correct chat message id", async () => {
		const eqSpy = vi.fn((value, expected) => value === expected);
		(ctx.drizzleClient.query.chatMessagesTable.findFirst as unknown as (args: {
			where: (
				fields: { id: string },
				operators: { eq: (value: string, expected: string) => boolean },
			) => boolean;
		}) => Promise<Partial<ChatMessage>>) = vi.fn(
			(params: {
				where: (
					fields: { id: string },
					operators: { eq: (value: string, expected: string) => boolean },
				) => boolean;
			}) => {
				if (params.where) {
					const dummyFields = { id: "dummyChatId" };
					params.where(dummyFields, { eq: eqSpy });
				}
				return Promise.resolve({
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
				});
			},
		);
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		ctx.drizzleClient.delete = vi.fn().mockReturnValue(
			createFakeDeleteChain([
				{
					id: "dummy",
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					body: "dummy",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
					chatId: "dummy-chat",
				},
			]),
		);

		await deleteChatMessageResolver({}, validArgs, ctx);
		expect(eqSpy).toHaveBeenCalledWith("dummyChatId", validArgs.input.id);
	});

	it("calls chatMembershipsWhereChat where lambda with correct member id", async () => {
		const eqSpy = vi.fn((value, expected) => value === expected);
		(ctx.drizzleClient.query.chatMessagesTable
			.findFirst as unknown as (params: {
			with?: {
				chat?: {
					with?: {
						chatMembershipsWhereChat?: {
							where: (
								fields: { memberId: string },
								operators: { eq: (value: string, expected: string) => boolean },
							) => boolean;
						};
					};
				};
			};
		}) => Promise<Partial<ChatMessage>>) = vi.fn(
			(params: {
				with?: {
					chat?: {
						with?: {
							chatMembershipsWhereChat?: {
								where: (
									fields: { memberId: string },
									operators: {
										eq: (value: string, expected: string) => boolean;
									},
								) => boolean;
							};
						};
					};
				};
			}) => {
				if (params.with?.chat?.with?.chatMembershipsWhereChat) {
					const chatMemberships =
						params.with.chat.with.chatMembershipsWhereChat;
					if (chatMemberships.where) {
						chatMemberships.where({ memberId: "dummyMember" }, { eq: eqSpy });
					}
				}
				return Promise.resolve({
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
				});
			},
		);
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		ctx.drizzleClient.delete = vi.fn().mockReturnValue(
			createFakeDeleteChain([
				{
					id: "dummy",
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					body: "dummy",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
					chatId: "dummy-chat",
				},
			]),
		);

		await deleteChatMessageResolver({}, validArgs, ctx);
		expect(eqSpy).toHaveBeenCalledWith(
			"dummyMember",
			ctx.currentClient.user?.id ?? "unknown",
		);
	});

	it("calls membershipsWhereOrganization where lambda with correct member id", async () => {
		const eqSpy = vi.fn((value, expected) => value === expected);
		(ctx.drizzleClient.query.chatMessagesTable.findFirst as unknown as (
			params: FindFirstParams,
		) => Promise<Partial<ChatMessage>>) = vi.fn((params: FindFirstParams) => {
			if (
				params.with?.chat?.with?.organization?.with
					?.membershipsWhereOrganization
			) {
				const membershipsWhereOrganization =
					params.with.chat.with.organization.with.membershipsWhereOrganization;
				if (membershipsWhereOrganization.where) {
					membershipsWhereOrganization.where(
						{ memberId: "dummyMemberOrg" },
						{ eq: eqSpy },
					);
				}
			}
			return Promise.resolve({
				creatorId: ctx.currentClient.user?.id ?? "unknown",
				chat: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
					chatMembershipsWhereChat: [{ role: "administrator" }],
				},
			});
		});
		mockUsersTableFindFirst(ctx, { role: "administrator" });
		ctx.drizzleClient.delete = vi.fn().mockReturnValue(
			createFakeDeleteChain([
				{
					id: "dummy",
					creatorId: ctx.currentClient.user?.id ?? "unknown",
					body: "dummy",
					chat: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
						chatMembershipsWhereChat: [{ role: "administrator" }],
					},
					chatId: "dummy-chat",
				},
			]),
		);

		await deleteChatMessageResolver({}, validArgs, ctx);
		expect(eqSpy).toHaveBeenCalledWith(
			"dummyMemberOrg",
			ctx.currentClient.user?.id ?? "unknown",
		);
	});

	it("throws an unauthorized error when current user is non-admin, not the creator, and memberships are non-admin", async () => {
		mockUsersTableFindFirst(ctx, { role: "user" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "someOtherUserId",
			chat: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		await expect(
			deleteChatMessageResolver({}, validArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});
});

// --- GraphQL Schema Wiring Tests ---
interface BuilderType {
	field: (config: unknown) => unknown;
	arg: (config: unknown) => unknown;
}

describe("GraphQL schema wiring", () => {
	let mutationFieldSpy: ReturnType<typeof vi.spyOn>;
	let localBuilder: typeof import("~/src/graphql/builder").builder;
	let localUpdateResolver: typeof deleteChatMessageResolver;

	beforeEach(async () => {
		vi.resetModules();
		const builderModule = await import("~/src/graphql/builder");
		localBuilder = builderModule.builder;
		mutationFieldSpy = vi.spyOn(localBuilder, "mutationField");

		const mod = await import("~/src/graphql/types/Mutation/deleteChatMessage");
		localUpdateResolver = mod.deleteChatMessageResolver;
	});

	afterEach(() => {
		mutationFieldSpy.mockRestore();
	});

	it("should register deleteChatMessage mutation correctly", () => {
		expect(mutationFieldSpy).toHaveBeenCalledWith(
			"deleteChatMessage",
			expect.any(Function),
		);

		const calls = mutationFieldSpy.mock.calls.filter(
			(call) => call[0] === "deleteChatMessage",
		);
		expect(calls.length).toBeGreaterThan(0);
		const callback = calls[0]?.[1] as (t: BuilderType) => unknown;
		if (!callback) {
			throw new Error("Callback not found in mutation field calls");
		}

		const dummyT: BuilderType = {
			field: vi.fn().mockImplementation((config) => config),
			arg: vi.fn().mockImplementation((config) => config),
		};

		const fieldConfig = callback(dummyT) as { args: Record<string, unknown> };

		expect(dummyT.field).toHaveBeenCalledWith(
			expect.objectContaining({
				type: expect.anything(),
				description: "Mutation field to delete a chat message.",
				args: expect.any(Object),
				resolve: localUpdateResolver,
			}),
		);

		expect(fieldConfig.args).toHaveProperty("input");
	});
});
