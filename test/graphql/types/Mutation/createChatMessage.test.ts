import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createChatMessage,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Sign in as admin to get an authentication token
let authToken: string;

beforeAll(async () => {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(signInResult.data?.signIn);
	const token = signInResult.data.signIn.authenticationToken;
	assertToBeNonNullish(token);
	authToken = token;
});

// Helper function to create an organization
async function createOrganization(): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				countryCode: "us",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper function to create a user
async function createUser(): Promise<{
	id: string;
	emailAddress: string;
}> {
	const email = `${faker.string.ulid()}@example.com`;
	const result = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				emailAddress: email,
				isEmailAddressVerified: true,
				name: faker.person.fullName(),
				password: "password123",
				role: "regular",
			},
		},
	});
	assertToBeNonNullish(result.data?.createUser);
	assertToBeNonNullish(result.data.createUser.user);
	const userId = result.data.createUser.user.id;
	assertToBeNonNullish(userId);
	return { id: userId, emailAddress: email };
}

// Helper function to get auth token for a user
async function getUserAuthToken(
	emailAddress: string,
	password: string,
): Promise<string> {
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress,
				password,
			},
		},
	});
	assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
	return signIn.data.signIn.authenticationToken;
}

// Helper function to create a chat
async function createChat(
	organizationId: string,
	userToken: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${userToken}` },
		variables: {
			input: {
				name: `Test Chat ${faker.string.uuid()}`,
				organizationId: organizationId,
			},
		},
	});
	assertToBeNonNullish(result.data?.createChat);
	return result.data.createChat.id;
}

suite("Mutation field createChatMessage", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			variables: {
				input: {
					chatId: faker.string.uuid(),
					body: "Test message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
		expect(result.data).toEqual({ createChatMessage: null });
	});

	test("unauthenticated error when user no longer exists", async () => {
		// Create a user
		const userEmail = `${faker.string.ulid()}@example.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					emailAddress: userEmail,
					isEmailAddressVerified: true,
					name: "Test User",
					password: "password123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data?.createUser);
		assertToBeNonNullish(createUserResult.data.createUser.authenticationToken);
		assertToBeNonNullish(createUserResult.data.createUser.user?.id);

		const userToken = createUserResult.data.createUser.authenticationToken;
		const userId = createUserResult.data.createUser.user.id;

		// Delete the user
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: { id: userId },
			},
		});

		// Try to create a message with deleted user's token
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					chatId: faker.string.uuid(),
					body: "Test message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	test("invalid_arguments error for invalid UUID format", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: "not-a-uuid",
					body: "Test message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "invalid_arguments" }),
			}),
		);
	});

	test("invalid_arguments error for empty message body", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: faker.string.uuid(),
					body: "",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "invalid_arguments" }),
			}),
		);
	});

	test("arguments_associated_resources_not_found when chat does not exist", async () => {
		const nonExistentChatId = faker.string.uuid();

		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: nonExistentChatId,
					body: "Test message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "chatId"],
						}),
					]),
				}),
			}),
		);
	});

	test("arguments_associated_resources_not_found when parent message does not exist", async () => {
		// Create organization, user, and chat
		const orgId = await createOrganization();
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, chatOwnerToken);

		// Try to create message with non-existent parent message
		const nonExistentParentId = faker.string.uuid();
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Reply message",
					parentMessageId: nonExistentParentId,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "parentMessageId"],
						}),
					]),
				}),
			}),
		);
	});

	test("arguments_associated_resources_not_found when parent message is from a different chat", async () => {
		// Create organization
		const orgId = await createOrganization();
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create first chat and a message in it
		const chat1Id = await createChat(orgId, chatOwnerToken);
		const parentMessageResult = await mercuriusClient.mutate(
			Mutation_createChatMessage,
			{
				headers: { authorization: `bearer ${chatOwnerToken}` },
				variables: {
					input: {
						chatId: chat1Id,
						body: "Parent message in chat 1",
					},
				},
			},
		);
		assertToBeNonNullish(parentMessageResult.data?.createChatMessage);
		const parentMessageId = parentMessageResult.data.createChatMessage.id;

		// Create second chat
		const chat2Id = await createChat(orgId, chatOwnerToken);

		// Try to create message in chat 2 with parent message from chat 1
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					chatId: chat2Id,
					body: "Reply in different chat",
					parentMessageId: parentMessageId,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "parentMessageId"],
						}),
					]),
				}),
			}),
		);
	});

	test("unauthorized_action_on_arguments_associated_resources when user is not admin, org member, or chat member", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create unauthorized user (not in organization or chat)
		const unauthorizedUser = await createUser();
		const unauthorizedToken = await getUserAuthToken(
			unauthorizedUser.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, chatOwnerToken);

		// Try to create message as unauthorized user
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${unauthorizedToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Unauthorized message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("unauthorized_action_on_arguments_associated_resources when org member (non-admin) without chat membership", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create regular org member (not in chat)
		const orgMember = await createUser();
		const orgMemberToken = await getUserAuthToken(
			orgMember.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner (admin)
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create organization membership for org member (regular, non-admin)
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgMember.id,
					role: "regular",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, chatOwnerToken);

		// Try to create message as org member who is not in chat
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${orgMemberToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Message from non-member",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action_on_arguments_associated_resources",
				}),
			}),
		);
	});

	test("successfully creates chat message as global administrator", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, chatOwnerToken);

		// Create message as global admin
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Message from global admin",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMessage);
		expect(result.data.createChatMessage.body).toBe(
			"Message from global admin",
		);
		assertToBeNonNullish(result.data.createChatMessage.chat);
		expect(result.data.createChatMessage.chat.id).toBe(chatId);

		// Verify message was created in database
		const createdMessage =
			await server.drizzleClient.query.chatMessagesTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, result.data?.createChatMessage?.id ?? ""),
			});
		assertToBeNonNullish(createdMessage);
		expect(createdMessage.body).toBe("Message from global admin");
	});

	test("successfully creates chat message as organization administrator", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, orgAdminToken);

		// Create message as org admin
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Message from org admin",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMessage);
		expect(result.data.createChatMessage.body).toBe("Message from org admin");
		assertToBeNonNullish(result.data.createChatMessage.chat);
		expect(result.data.createChatMessage.chat.id).toBe(chatId);
	});

	test("successfully creates chat message as chat member", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create chat owner (org admin)
		const chatOwner = await createUser();
		const chatOwnerToken = await getUserAuthToken(
			chatOwner.emailAddress,
			"password123",
		);

		// Create chat member
		const chatMember = await createUser();
		const chatMemberToken = await getUserAuthToken(
			chatMember.emailAddress,
			"password123",
		);

		// Create organization membership for chat owner
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatOwner.id,
					role: "administrator",
				},
			},
		});

		// Create organization membership for chat member (required for authorization)
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: chatMember.id,
					role: "regular",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, chatOwnerToken);

		// Add chat member to chat
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${chatOwnerToken}` },
			variables: {
				input: {
					chatId: chatId,
					memberId: chatMember.id,
					role: "regular",
				},
			},
		});

		// Create message as chat member
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${chatMemberToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Message from chat member",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMessage);
		expect(result.data.createChatMessage.body).toBe("Message from chat member");
		assertToBeNonNullish(result.data.createChatMessage.chat);
		expect(result.data.createChatMessage.chat.id).toBe(chatId);
	});

	test("successfully creates reply message with parentMessageId", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, orgAdminToken);

		// Create parent message
		const parentMessageResult = await mercuriusClient.mutate(
			Mutation_createChatMessage,
			{
				headers: { authorization: `bearer ${orgAdminToken}` },
				variables: {
					input: {
						chatId: chatId,
						body: "Parent message",
					},
				},
			},
		);

		assertToBeNonNullish(parentMessageResult.data?.createChatMessage);
		const parentMessageId = parentMessageResult.data.createChatMessage.id;

		// Create reply message
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Reply message",
					parentMessageId: parentMessageId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createChatMessage);
		expect(result.data.createChatMessage.body).toBe("Reply message");
		expect(result.data.createChatMessage.parentMessage?.id).toBe(
			parentMessageId,
		);

		// Verify in database
		const createdMessage =
			await server.drizzleClient.query.chatMessagesTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, result.data?.createChatMessage?.id ?? ""),
			});
		assertToBeNonNullish(createdMessage);
		expect(createdMessage.parentMessageId).toBe(parentMessageId);
	});

	test("unexpected error when database insertion fails", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, orgAdminToken);

		// Mock the database insert to return empty array
		const insertSpy = vi.spyOn(server.drizzleClient, "insert").mockReturnValue({
			values: () => ({
				returning: () => Promise.resolve([]), // Empty array causes undefined
			}),
		} as never);

		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Test message",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		insertSpy.mockRestore();
	});

	test("pubsub publish is called with correct payload and topic", async () => {
		// Create organization
		const orgId = await createOrganization();

		// Create org admin
		const orgAdmin = await createUser();
		const orgAdminToken = await getUserAuthToken(
			orgAdmin.emailAddress,
			"password123",
		);

		// Create organization membership for org admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		// Create chat
		const chatId = await createChat(orgId, orgAdminToken);

		// Get pubsub from server.graphql context to spy on it
		const publishSpy = vi.spyOn(server.graphql.pubsub, "publish");

		// Create message
		const result = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					chatId: chatId,
					body: "Test message for pubsub",
				},
			},
		});

		assertToBeNonNullish(result.data?.createChatMessage);
		const messageId = result.data.createChatMessage.id;

		// Verify pubsub.publish was called
		expect(publishSpy).toHaveBeenCalledWith({
			payload: expect.objectContaining({
				id: messageId,
				body: "Test message for pubsub",
				chatId: chatId,
			}),
			topic: `chats.${chatId}:chat_messages::create`,
		});

		publishSpy.mockRestore();
	});
});
