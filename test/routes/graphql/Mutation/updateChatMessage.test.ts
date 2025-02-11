import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { updateChatMessageResolver } from "~/src/graphql/types/Mutation/updateChatMessage";
import type { User } from "~/src/graphql/types/User/User";

interface ChatMessage {
	id: string;
	creatorId: string;
	body: string;
	chat?: {
		organization: {
			membershipsWhereOrganization: { role: string; memberId?: string }[];
		};
		chatMembershipsWhereChat: { role: string }[];
	};
}

const createMockContext = (
	overrides: Partial<GraphQLContext> = {},
): GraphQLContext => {
	return {
		currentClient: {
			isAuthenticated: true,
			user: { id: "11111111-1111-1111-1111-111111111111" } as NonNullable<
				GraphQLContext["currentClient"]["user"]
			>,
		},
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				chatMessagesTable: { findFirst: vi.fn() },
			},
			update: vi.fn(),
			transaction: vi.fn(), // if needed in other tests
		},
		minio: {
			client: { removeObjects: vi.fn(() => Promise.resolve()) },
			bucketName: "talawa",
		},
		envConfig: { API_BASE_URL: "http://localhost" },
		jwt: { sign: vi.fn() },
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		...overrides,
	} as GraphQLContext;
};

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
// Create a schema for the mutation arguments, matching the resolver's expectations.

let args: { input: { id: string; body: string } };

describe("updateChatMessage mutation", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		// Reset the context before each test.
		ctx = createMockContext();
		args = {
			input: {
				id: "11111111-1111-1111-1111-111111111111",
				body: "Updated chat message body",
			},
		};
	});

	it("throws an unauthenticated error when the client is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws an invalid_arguments error when input validation fails", async () => {
		// Provide an invalid id format to trigger validation error.
		const invalidArgs = {
			input: { id: "invalid-uuid", body: "Updated chat message body" },
		};
		await expect(
			updateChatMessageResolver({}, invalidArgs, ctx),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "invalid_arguments" }),
			}),
		);
	});

	it("throws an arguments_associated_resources_not_found error if chat message is not found", async () => {
		mockUsersTableFindFirst(ctx);

		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue(undefined);

		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});

	it("throws an unauthorized error if the current user is not allowed to update the message", async () => {
		mockUsersTableFindFirst(ctx);
		mockChatMessagesTableFindFirst(ctx);

		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unexpected error if the update operation returns undefined", async () => {
		(ctx.currentClient.user as NonNullable<typeof ctx.currentClient.user>).id =
			"11111111-1111-1111-1111-111111111111";
		mockUsersTableFindFirst(ctx, {
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		const returningMock = vi.fn().mockResolvedValue([]);
		(ctx.drizzleClient.update as ReturnType<typeof vi.fn>).mockReturnValue({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			returning: returningMock,
		});
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);
	});

	it("successfully updates and returns the updated chat message", async () => {
		(ctx.currentClient.user as NonNullable<typeof ctx.currentClient.user>).id =
			"11111111-1111-1111-1111-111111111111";
		mockUsersTableFindFirst(ctx, {
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		const updatedChatMessage: ChatMessage = {
			id: args.input.id,
			creatorId: ctx.currentClient.user?.id ?? "",
			body: args.input.body,
		};

		const returningMock = vi.fn().mockResolvedValue([updatedChatMessage]);
		(ctx.drizzleClient.update as ReturnType<typeof vi.fn>).mockReturnValue({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			returning: returningMock,
		});

		const result = await updateChatMessageResolver({}, args, ctx);
		expect(result).toEqual(updatedChatMessage);
		expect(returningMock).toHaveBeenCalled();
	});

	it("throws an unauthorized error if the user is not a member of the organization", async () => {
		(ctx.currentClient.user as NonNullable<typeof ctx.currentClient.user>).id =
			"regularUserId";
		mockUsersTableFindFirst(ctx, { id: "regularUserId" });
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "someOtherUserId",
			chat: {
				organization: { membershipsWhereOrganization: [] },
				chatMembershipsWhereChat: [],
			},
		});
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unauthorized error if the user is not a member of the chat", async () => {
		(ctx.currentClient.user as NonNullable<typeof ctx.currentClient.user>).id =
			"regularUserId";

		mockUsersTableFindFirst(ctx, { id: "regularUserId" });

		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "someOtherUserId",
			chat: {
				organization: {
					membershipsWhereOrganization: [
						{ role: "member", memberId: "someOrgMember" },
					],
				},
				chatMembershipsWhereChat: [],
			},
		});
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("executes inline where functions in queries", async () => {
		const eqSpy = vi.fn((a, b) => a === b);
		const dummyOperators = { eq: eqSpy };

		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(
			(options: {
				where: (
					value: { id: string },
					operators: { eq: (a: unknown, b: unknown) => boolean },
				) => void;
			}) => {
				options.where({ id: ctx.currentClient.user?.id ?? "" }, dummyOperators);
				return Promise.resolve({
					role: "administrator",
					id: ctx.currentClient.user?.id ?? "",
				});
			},
		);

		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation((options) => {
			options.where({ id: args.input.id }, dummyOperators);

			options.with.chat.with.chatMembershipsWhereChat.where(
				{ memberId: ctx.currentClient.user?.id ?? "" },
				dummyOperators,
			);

			options.with.chat.with.organization.with.membershipsWhereOrganization.where(
				{ memberId: ctx.currentClient.user?.id ?? "" },
				dummyOperators,
			);

			return Promise.resolve({
				creatorId: ctx.currentClient.user?.id ?? "",
				chat: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
					chatMembershipsWhereChat: [{ role: "member" }],
				},
			});
		});

		const updatedChatMessage = {
			id: args.input.id,
			creatorId: ctx.currentClient.user?.id ?? "",
			body: args.input.body,
		};
		const returningMock = vi.fn().mockResolvedValue([updatedChatMessage]);
		(ctx.drizzleClient.update as ReturnType<typeof vi.fn>).mockReturnValue({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			returning: returningMock,
		});

		const result = await updateChatMessageResolver({}, args, ctx);
		expect(result).toEqual(updatedChatMessage);
		expect(eqSpy).toHaveBeenCalledTimes(4);
	});

	it("throws an unauthorized error if currentUserOrganizationMembership and currentUserChatMembership are undefined", async () => {
		mockUsersTableFindFirst(ctx, {
			id: "11111111-1111-1111-1111-111111111111",
		});
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [],
				},
				chatMembershipsWhereChat: [],
			},
		});
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unauthenticated error if the current user is not found in the users table", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws an unauthorized error if the current user is not the creator of the chat message", async () => {
		mockUsersTableFindFirst(ctx, {
			id: "11111111-1111-1111-1111-111111111111",
		});
		mockChatMessagesTableFindFirst(ctx, {
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [],
				},
				chatMembershipsWhereChat: [],
			},
		});
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});
});

// Define a minimal type for the builder used in the schema wiring.
interface BuilderType {
	field: (config: unknown) => unknown;
	arg: (config: unknown) => unknown;
}

describe("GraphQL schema wiring", () => {
	let mutationFieldSpy: ReturnType<typeof vi.spyOn>;
	let localBuilder: typeof import("~/src/graphql/builder").builder;
	let localUpdateResolver: typeof updateChatMessageResolver;

	beforeEach(async () => {
		vi.resetModules();
		const builderModule = await import("~/src/graphql/builder");
		localBuilder = builderModule.builder;
		mutationFieldSpy = vi.spyOn(localBuilder, "mutationField");

		const mod = await import("~/src/graphql/types/Mutation/updateChatMessage");
		localUpdateResolver = mod.updateChatMessageResolver;
	});

	afterEach(() => {
		mutationFieldSpy.mockRestore();
	});

	it("should register updateChatMessage mutation correctly", () => {
		expect(mutationFieldSpy).toHaveBeenCalledWith(
			"updateChatMessage",
			expect.any(Function),
		);

		const calls = mutationFieldSpy.mock.calls.filter(
			(call) => call[0] === "updateChatMessage",
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
				description: "Mutation field to update a chat message.",
				args: expect.any(Object),
				resolve: localUpdateResolver,
			}),
		);

		expect(fieldConfig.args).toHaveProperty("input");
	});
});
