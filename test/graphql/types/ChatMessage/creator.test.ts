import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/ChatMessage/creator";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the creator resolver from the schema
const chatMessageType = schema.getType("ChatMessage");
if (!chatMessageType || !("getFields" in chatMessageType)) {
	throw new Error("ChatMessage type not found or is not an object type");
}
const creatorField = (chatMessageType as GraphQLObjectType).getFields().creator;
if (!creatorField) {
	throw new Error("creator field not found on ChatMessage type");
}
const creatorResolver = creatorField.resolve as (
	parent: ChatMessage,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("ChatMessage.creator field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockChatMessage: ChatMessage;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
		mockChatMessage = {
			id: "chat-message-111",
			chatId: "chat-456",
			creatorId: "creator-789",
			body: "Hello, this is a test message",
			createdAt: new Date("2024-01-15T10:30:00Z"),
			updatedAt: new Date("2024-01-16T10:30:00Z"),
			parentMessageId: null,
		};
	});

	describe("Null creatorId handling", () => {
		it("should return null when creatorId is null", async () => {
			mockChatMessage.creatorId = null;

			const result = await creatorResolver(mockChatMessage, {}, ctx);

			expect(result).toBeNull();
			// Should not query the database when creatorId is null
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});

	describe("Corrupted data checks", () => {
		it("should throw unexpected error when creator user is not found (corrupted data)", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					return Promise.resolve(undefined);
				},
			);

			await expect(
				creatorResolver(mockChatMessage, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a chat's creator id that isn't null.",
			);
		});
	});

	describe("Successful resolution", () => {
		it("should return the creator user when creatorId exists and user is found", async () => {
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				creatorUser,
			);

			const result = await creatorResolver(mockChatMessage, {}, ctx);

			expect(result).toEqual(creatorUser);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Where clause coverage", () => {
		it("should execute usersTable where clause with correct creatorId", async () => {
			const eqMock = vi.fn();
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					return Promise.resolve(creatorUser);
				},
			);

			await creatorResolver(mockChatMessage, {}, ctx);

			// Verify eq was called with correct parameters
			expect(eqMock).toHaveBeenCalledWith(
				"users.id",
				mockChatMessage.creatorId,
			);
		});
	});
});
