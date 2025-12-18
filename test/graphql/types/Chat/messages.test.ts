import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import { assertToBeNonNullish } from "test/helpers";
import { afterEach, describe, expect, test } from "vitest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createChatMessage,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// GraphQL query for Chat.messages connection
const Query_chat_messages = graphql(`
	query Query_chat_messages($input: QueryChatInput!, $first: Int, $last: Int, $after: String, $before: String) {
		chat(input: $input) {
			id
			messages(first: $first, last: $last, after: $after, before: $before) {
				edges {
					cursor
					node {
						id
						body
						createdAt
						creator {
							id
							name
						}
					}
				}
				pageInfo {
					hasNextPage
					hasPreviousPage
					startCursor
					endCursor
				}
			}
		}
	}
`);

const TEST_PASSWORD = "password123";

async function signinAdmin() {
	const adminSignIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(adminSignIn.data?.signIn?.authenticationToken);
	return adminSignIn;
}

async function createCreator(adminToken: string) {
	const creator = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: TEST_PASSWORD,
				role: "regular",
				isEmailAddressVerified: false,
			},
		},
	});

	return creator;
}

async function createOrgMutation(adminToken: string) {
	return mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
		},
	});
}

async function createChatMutation(creatorToken: string, orgId: string) {
	return mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${creatorToken}` },
		variables: {
			input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
		},
	});
}

describe("Chat.messages integration tests", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.warn("cleanup error:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("returns all messages and supports forward pagination and backward pagination with last/before", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Add creator as chat member so they can send messages
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, memberId: creator.user.id } },
		});

		// Querying empty chat for messages should not return an error
		const emptyChat = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(emptyChat.errors).toBeUndefined();

		const emptyEdges = emptyChat.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(Array.isArray(emptyEdges)).toBe(true);
		expect(emptyEdges.length).toBe(0);
		expect(emptyChat.data?.chat?.messages?.pageInfo?.hasNextPage).toBe(false);
		expect(emptyChat.data?.chat?.messages?.pageInfo?.hasPreviousPage).toBe(
			false,
		);

		// Create multiple messages in the chat
		const msg1 = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, body: "First message" } },
		});
		assertToBeNonNullish(msg1.data?.createChatMessage);

		const msg2 = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, body: "Second message" } },
		});
		assertToBeNonNullish(msg2.data?.createChatMessage);

		const msg3 = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, body: "Third message" } },
		});
		assertToBeNonNullish(msg3.data?.createChatMessage);

		// Query all messages
		const all = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(all.errors).toBeUndefined();

		const edges = all.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(Array.isArray(edges)).toBe(true);
		expect(edges.length).toBe(3);
		expect(edges[0]?.node.body).toBe("First message");
		expect(edges[1]?.node.body).toBe("Second message");
		expect(edges[2]?.node.body).toBe("Third message");

		// Query all messages by super admin
		const allByAdmin = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(allByAdmin.errors).toBeUndefined();

		// Test forward pagination
		const page1 = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1 },
		});
		expect(page1.errors).toBeUndefined();
		const edges1 = page1.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(edges1.length).toBe(1);
		expect(edges1[0]?.node.body).toBe("First message");

		const endCursor = page1.data?.chat?.messages?.pageInfo?.endCursor as
			| string
			| undefined;
		expect(typeof endCursor).toBe("string");
		expect(page1.data?.chat?.messages?.pageInfo?.hasNextPage).toBe(true);

		const page2 = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 10, after: endCursor },
		});
		expect(page2.errors).toBeUndefined();
		const edges2 = page2.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(edges2.length).toBe(2);
		expect(edges2[0]?.node.body).toBe("Second message");
		expect(edges2[1]?.node.body).toBe("Third message");

		// Test backward pagination
		const lastPage = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, last: 1 },
		});
		expect(lastPage.errors).toBeUndefined();
		const lastEdges = lastPage.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(lastEdges.length).toBe(1);
		expect(lastEdges[0]?.node.body).toBe("Third message");

		const startCursor = lastPage.data?.chat?.messages?.pageInfo?.startCursor as
			| string
			| undefined;
		expect(typeof startCursor).toBe("string");

		const prevPage = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, last: 2, before: startCursor },
		});
		expect(prevPage.errors).toBeUndefined();
		const prevEdges = prevPage.data?.chat?.messages?.edges as Array<{
			cursor: string;
			node: { id: string; body: string };
		}>;
		expect(prevEdges.length).toBe(2);
		expect(prevEdges[0]?.node.body).toBe("First message");
		expect(prevEdges[1]?.node.body).toBe("Second message");
	});

	test("invalid messagesArgumentsSchema returns 'invalid_arguments' as the extensions code", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Test with invalid cursor
		const invalidCursor = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1, after: "not-a-cursor" },
		});
		expect(invalidCursor.errors).toBeDefined();
		expect(invalidCursor.errors?.[0]?.extensions?.code).toBe(
			"invalid_arguments",
		);

		// Test with both first and last
		const firstLast = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 5, last: 5 },
		});
		expect(firstLast.errors).toBeDefined();
		expect(firstLast.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("cursor pointing to non-existent message returns error", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Add creator as chat member so they can query messages
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, memberId: creator.user.id } },
		});

		// Create a fake cursor with non-existent message ID
		const fakeCursorObj = { id: faker.string.uuid() };
		const fakeCursor = Buffer.from(JSON.stringify(fakeCursorObj)).toString(
			"base64url",
		);

		const missing = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1, after: fakeCursor },
		});
		expect(missing.errors).toBeDefined();
		const code = missing.errors?.[0]?.extensions?.code as string;
		expect(code).toBe("arguments_associated_resources_not_found");

		// backward pagination with non-existent cursor should return error
		const missingBefore = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, last: 1, before: fakeCursor },
		});
		expect(missingBefore.errors).toBeDefined();
		const codeBefore = missingBefore.errors?.[0]?.extensions?.code as string;
		expect(codeBefore).toBe("arguments_associated_resources_not_found");
	});

	test("unauthenticated request returns error", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Query without authorization
		const result = await mercuriusClient.query(Query_chat_messages, {
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("non-member cannot access chat messages", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		// Create chat creator
		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		// Create non-member user
		const outsiderRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: TEST_PASSWORD,
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(outsiderRes.data?.createUser);
		const outsider = outsiderRes.data?.createUser;

		assertToBeNonNullish(outsider.user);
		assertToBeNonNullish(outsider.user?.id);

		const outsiderId = outsider.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: outsiderId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: outsider.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Outsider Signin
		assertToBeNonNullish(outsider.user?.emailAddress);
		const outsiderSignin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: outsider.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(outsiderSignin.data?.signIn?.authenticationToken);
		const outsiderToken = outsiderSignin.data?.signIn
			?.authenticationToken as string;

		// Try to access messages as non-member
		const result = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${outsiderToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
	});

	test("non-org member can not access messages in chat", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		const nonOrgMemberRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: TEST_PASSWORD,
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(nonOrgMemberRes.data?.createUser);
		const nonOrgMember = nonOrgMemberRes.data?.createUser;

		assertToBeNonNullish(nonOrgMember.user);
		assertToBeNonNullish(nonOrgMember.user?.id);

		const nonOrgMemberId = nonOrgMember.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: nonOrgMemberId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		// Make creator regular org member
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		// Creator signin
		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Add creator as chat member so they can send messages
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, memberId: creator.user.id } },
		});

		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, body: "Test message" } },
		});

		// Non org member signin
		assertToBeNonNullish(nonOrgMember.user?.emailAddress);
		const nonOrgMemberSignin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: nonOrgMember.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(nonOrgMemberSignin.data?.signIn?.authenticationToken);
		const nonOrgMemberToken = nonOrgMemberSignin.data?.signIn
			?.authenticationToken as string;

		// Fetch message from non-org member should result in error
		const result = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${nonOrgMemberToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("organization admin can access chat messages", async () => {
		const adminSignIn = await signinAdmin();
		const adminToken = adminSignIn.data?.signIn?.authenticationToken as string;

		// Create chat creator
		const creatorRes = await createCreator(adminToken);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data?.createUser;

		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user?.id);

		const creatorId = creator.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

		// Create org admin
		const orgAdminRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: TEST_PASSWORD,
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(orgAdminRes.data?.createUser);
		const orgAdmin = orgAdminRes.data?.createUser;

		assertToBeNonNullish(orgAdmin.user);
		assertToBeNonNullish(orgAdmin.user?.id);

		const orgAdminId = orgAdmin.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgAdminId } },
			});
		});

		const orgRes = await createOrgMutation(adminToken);
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const org = orgRes.data?.createOrganization;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: org.id } },
			});
		});

		// Make creator regular org member
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		// Make orgAdmin an org administrator
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: orgAdmin.user.id,
					organizationId: org.id,
					role: "administrator",
				},
			},
		});

		assertToBeNonNullish(creator.user?.emailAddress);
		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data?.signIn
			?.authenticationToken as string;

		assertToBeNonNullish(orgAdmin.user?.emailAddress);
		const orgAdminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: orgAdmin.user.emailAddress,
					password: TEST_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(orgAdminSignIn.data?.signIn?.authenticationToken);
		const orgAdminToken = orgAdminSignIn.data?.signIn
			?.authenticationToken as string;

		const chatRes = await createChatMutation(creatorToken, org.id);
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		// Add creator as chat member so they can send messages
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, memberId: creator.user.id } },
		});

		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId: chat.id, body: "Test message" } },
		});

		// Org admin should be able to access messages even though not a member
		const result = await mercuriusClient.query(Query_chat_messages, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(result.errors).toBeUndefined();
		const edges = result.data?.chat?.messages?.edges as Array<{
			node: { body: string };
		}>;
		expect(edges.length).toBe(1);
		expect(edges[0]?.node.body).toBe("Test message");
	});
});
