import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/ChatMessage/chat";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the chat resolver from the schema
const chatMessageType = schema.getType("ChatMessage") as GraphQLObjectType;
const chatField = chatMessageType.getFields().chat;
if (!chatField) {
	throw new Error("chat field not found on ChatMessage type");
}
const chatResolver = chatField.resolve as (
	parent: ChatMessage,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("ChatMessage.chat field resolver - Unit tests", () => {
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

	describe("Corrupted data checks", () => {
		it("should throw unexpected error when chat is not found (corrupted data)", async () => {
			mocks.drizzleClient.query.chatsTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "chats.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					return Promise.resolve(undefined);
				},
			);

			await expect(
				chatResolver(mockChatMessage, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a chat message's chat id that isn't null.",
			);
		});
	});

	describe("Successful resolution", () => {
		it("should return the chat when chatId exists and chat is found", async () => {
			const existingChat = {
				id: "chat-456",
				name: "Test Chat",
				organizationId: "org-123",
				creatorId: "creator-111",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-02T00:00:00Z"),
			};

			mocks.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				existingChat,
			);

			const result = await chatResolver(mockChatMessage, {}, ctx);

			expect(result).toEqual(existingChat);
			expect(
				mocks.drizzleClient.query.chatsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Where clause coverage", () => {
		it("should execute chatsTable where clause with correct chatId", async () => {
			const eqMock = vi.fn();
			const existingChat = {
				id: "chat-456",
				name: "Test Chat",
				organizationId: "org-123",
				creatorId: "creator-111",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-02T00:00:00Z"),
			};

			mocks.drizzleClient.query.chatsTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "chats.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					return Promise.resolve(existingChat);
				},
			);

			await chatResolver(mockChatMessage, {}, ctx);

			// Verify eq was called with correct parameters
			expect(eqMock).toHaveBeenCalledWith("chats.id", mockChatMessage.chatId);
		});
	});
});
