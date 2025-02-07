import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateChatMessageResolver } from "~/src/graphql/types/Mutation/updateChatMessage";

// Define the types for the user and chat message returned from the database.
interface User {
	id: string;
	role: string;
}

interface ChatMessage {
	id: string;
	creatorId: string;
	body: string;
	chat?: {
		organization: { membershipsWhereOrganization: { role: string }[] };
		chatMembershipsWhereChat: { role: string }[];
	};
}

// Define types for the drizzle client query functions.
interface DrizzleClientQueryUsersTable {
	findFirst: (args: { where: unknown; columns?: unknown }) => Promise<
		User | undefined
	>;
}

interface DrizzleClientQueryChatMessagesTable {
	findFirst: (args: {
		where: unknown;
		columns?: unknown;
		with?: { chat: true };
	}) => Promise<ChatMessage | undefined>;
}

interface DrizzleClientUpdate {
	set: (data: Record<string, unknown>) => DrizzleClientUpdate;
	where: (predicate: unknown) => DrizzleClientUpdate;
	returning: () => Promise<ChatMessage[]>;
}

interface DrizzleClient {
	query: {
		usersTable: DrizzleClientQueryUsersTable;
		chatMessagesTable: DrizzleClientQueryChatMessagesTable;
	};
	update: (table: unknown) => DrizzleClientUpdate;
}

// Define the test context type.
interface TestContext {
	currentClient: {
		isAuthenticated: boolean;
		user: { id: string };
	};
	drizzleClient: DrizzleClient;
}

describe("updateChatMessage mutation", () => {
	let ctx: TestContext;
	// Use a valid UUID format for the id.
	let args: { input: { id: string; body: string } };

	beforeEach(() => {
		// Reset the test context before each test.
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "11111111-1111-1111-1111-111111111111" },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn() as DrizzleClientQueryUsersTable["findFirst"],
					},
					chatMessagesTable: {
						findFirst:
							vi.fn() as DrizzleClientQueryChatMessagesTable["findFirst"],
					},
				},
				update: vi.fn(),
			},
		};

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
		// Provide an invalid id format to trigger validation error
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
		// Simulate a valid user but no chat message found.
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "11111111-1111-1111-1111-111111111111",
		});
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
		// Simulate a user that is not authorized:
		// - Current user is a regular user (not an administrator)
		// - The chat message was created by another user.
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "11111111-1111-1111-1111-111111111111",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "22222222-2222-2222-2222-222222222222",
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

	it("throws an unexpected error if the update operation returns undefined", async () => {
		// Simulate an authorized scenario.
		ctx.currentClient.user.id = "11111111-1111-1111-1111-111111111111";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		// Simulate that the update returns no updated rows.
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
		// Simulate an authorized update scenario.
		ctx.currentClient.user.id = "11111111-1111-1111-1111-111111111111";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "administrator",
			id: "11111111-1111-1111-1111-111111111111",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
				chatMembershipsWhereChat: [{ role: "member" }],
			},
		});

		const updatedChatMessage: ChatMessage = {
			id: "11111111-1111-1111-1111-111111111111",
			creatorId: "11111111-1111-1111-1111-111111111111",
			body: "Updated chat message body",
		};

		// Simulate the update operation returning the updated row.
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
		// Arrange: User is not a member of the organization
		ctx.currentClient.user.id = "regularUserId";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "regularUserId",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "someOtherUserId",
			chat: {
				organization: {
					membershipsWhereOrganization: [], // Empty memberships array!
				},
				chatMembershipsWhereChat: [],
			},
		});

		// Act & Assert
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unauthorized error if the user is not a member of the chat", async () => {
		// Arrange: User is not a member of the chat
		ctx.currentClient.user.id = "regularUserId";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "regularUserId",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "someOtherUserId",
			chat: {
				organization: {
					membershipsWhereOrganization: [
						{ role: "member", memberId: "someOrgMember" },
					],
				},
				chatMembershipsWhereChat: [], // Empty memberships array!
			},
		});

		// Act & Assert
		await expect(updateChatMessageResolver({}, args, ctx)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	it("throws an unauthorized error if user is not org admin and chat membership is not found", async () => {
		ctx.currentClient.user.id = "regularUserId";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "regularUserId",
		});
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "someOtherUserId",
			chat: {
				organization: {
					membershipsWhereOrganization: [
						{ role: "member", memberId: "someOrgMember" },
					],
				},
				chatMembershipsWhereChat: [], // Membership is not found
			},
		});

		// Act & Assert
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
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "11111111-1111-1111-1111-111111111111",
		});

		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "22222222-2222-2222-2222-222222222222", // Different from current user's ID
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

	it("throws an unauthorized error if currentUserOrganizationMembership is undefined", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "11111111-1111-1111-1111-111111111111",
		});

		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: { membershipsWhereOrganization: [] }, // Empty array triggers undefined membership
				chatMembershipsWhereChat: [{ role: "member" }],
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
		// Create a spy for the 'eq' operator.
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
				options.where({ id: ctx.currentClient.user.id }, dummyOperators);
				return Promise.resolve({
					role: "administrator",
					id: ctx.currentClient.user.id,
				});
			},
		);

		// Override chatMessagesTable.findFirst to call its inline where functions.
		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation((options) => {
			options.where({ id: args.input.id }, dummyOperators);

			options.with.chat.with.chatMembershipsWhereChat.where(
				{ memberId: ctx.currentClient.user.id },
				dummyOperators,
			);

			options.with.chat.with.organization.with.membershipsWhereOrganization.where(
				{ memberId: ctx.currentClient.user.id },
				dummyOperators,
			);

			return Promise.resolve({
				creatorId: ctx.currentClient.user.id,
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
			creatorId: ctx.currentClient.user.id,
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
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			role: "user",
			id: "11111111-1111-1111-1111-111111111111",
		});

		(
			ctx.drizzleClient.query.chatMessagesTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			creatorId: "11111111-1111-1111-1111-111111111111",
			chat: {
				organization: { membershipsWhereOrganization: [] },
				chatMembershipsWhereChat: [], // Both are empty arrays
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

// ─────────────────────────────────────────────────────────────────────────────
// The following block tests the GraphQL schema wiring (i.e. lines 169–179)
// by spying on builder.mutationField and invoking its callback.
// ─────────────────────────────────────────────────────────────────────────────

describe("GraphQL schema wiring", () => {
	// We use module isolation so that we can spy on builder.mutationField
	let mutationFieldSpy: ReturnType<typeof vi.spyOn>;
	let localBuilder: typeof import("~/src/graphql/builder").builder;
	let localUpdateResolver: typeof updateChatMessageResolver;

	beforeEach(async () => {
		vi.resetModules();
		// Import the builder and spy on its mutationField method.
		const builderModule = await import("~/src/graphql/builder");
		localBuilder = builderModule.builder;
		mutationFieldSpy = vi.spyOn(localBuilder, "mutationField");

		// Re-import the module to trigger the mutationField registration.
		const mod = await import("~/src/graphql/types/Mutation/updateChatMessage");
		localUpdateResolver = mod.updateChatMessageResolver;
	});

	afterEach(() => {
		mutationFieldSpy.mockRestore();
	});

	interface BuilderType {
		field: (config: unknown) => unknown;
		arg: (config: unknown) => unknown;
	}

	it("should register updateChatMessage mutation correctly", () => {
		// Check that mutationField was called with the correct name and a function.
		expect(mutationFieldSpy).toHaveBeenCalledWith(
			"updateChatMessage",
			expect.any(Function),
		);

		// Retrieve the callback passed to mutationField.
		const calls = mutationFieldSpy.mock.calls.filter(
			(call) => call[0] === "updateChatMessage",
		);
		expect(calls.length).toBeGreaterThan(0);
		const callback = calls[0]?.[1] as (t: BuilderType) => unknown;
		if (!callback) {
			throw new Error("Callback not found in mutation field calls");
		}

		// Create a dummy 't' object with minimal implementations of 'field' and 'arg'.
		const dummyT = {
			field: vi.fn().mockImplementation((config) => config),
			arg: vi.fn().mockImplementation((config) => config),
		};

		// Invoke the callback to get the field configuration.
		const fieldConfig = callback(dummyT) as { args: Record<string, unknown> };

		// Verify that t.field was called with the expected configuration.
		expect(dummyT.field).toHaveBeenCalledWith(
			expect.objectContaining({
				type: expect.anything(), // Your ChatMessage type
				description: "Mutation field to update a chat message.",
				args: expect.any(Object),
				resolve: localUpdateResolver,
			}),
		);

		// Optionally, check that the configuration includes an "input" argument defined using t.arg.
		expect(fieldConfig.args).toHaveProperty("input");
	});
});
