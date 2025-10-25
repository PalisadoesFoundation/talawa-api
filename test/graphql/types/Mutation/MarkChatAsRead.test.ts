import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
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
	Mutation_deleteChat,
	Mutation_deleteChatMembership,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Mutation_markChatAsRead,
	Query_chat_with_unread,
	Query_signIn,
} from "../documentNodes";

suite("Mutation markChatAsRead", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("cleanup failed:", err);
			}
		}
		cleanupFns.length = 0;
	});

	beforeAll(async () => {
		// ensure admin exists by signing in
		if (!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error("admin env not set");
		}
	});

	test("full flow: create chat, send message, mark read", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		// create two users
		const user1Res = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(user1Res.data?.createUser);
		const user1 = user1Res.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user1.user?.id } },
			});
		});

		const user2Res = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(user2Res.data?.createUser);
		const user2 = user2Res.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user2.user?.id } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user1.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		// cleanup the organization membership for user1
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { memberId: user1.user?.id, organizationId: orgId },
				},
			});
		});
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user2.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		// cleanup the organization membership for user2
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { memberId: user2.user?.id, organizationId: orgId },
				},
			});
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${user1.authenticationToken}` },
			variables: {
				input: { name: "talawa", organizationId: orgId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${user1.authenticationToken}` },
			variables: { input: { chatId, memberId: user1.user?.id } },
		});
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChatMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { chatId, memberId: user1.user?.id } },
			});
		});
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${user1.authenticationToken}` },
			variables: { input: { chatId, memberId: user2.user?.id } },
		});
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChatMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { chatId, memberId: user2.user?.id } },
			});
		});

		const messageRes = await mercuriusClient.mutate(
			Mutation_createChatMessage,
			{
				headers: { authorization: `bearer ${user1.authenticationToken}` },
				variables: { input: { chatId, body: "hello" } },
			},
		);
		assertToBeNonNullish(messageRes.data?.createChatMessage);
		const messageId = messageRes.data.createChatMessage.id;

		const markRes = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${user2.authenticationToken}` },
			variables: { input: { chatId, messageId } },
		});
		expect(markRes.errors).toBeUndefined();
		expect(markRes.data).toBeDefined();
		expect(markRes.data?.markChatAsRead).toBe(true);

		const chatQueryRes = await mercuriusClient.query(Query_chat_with_unread, {
			headers: { authorization: `bearer ${user2.authenticationToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(chatQueryRes.data?.chat);
		expect(chatQueryRes.data.chat.hasUnread).toBe(false);
		expect(chatQueryRes.data.chat.unreadMessagesCount).toBe(0);
		expect(chatQueryRes.data.chat.firstUnreadMessageId).toBeNull();
	});

	test("unauthenticated: markChatAsRead requires auth", async () => {
		const res = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			variables: {
				input: { chatId: "non-existent", messageId: "x" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("invalid arguments: non-UUID input yields invalid_arguments", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { chatId: "not-a-uuid", messageId: "also-not-uuid" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("arguments_associated_resources_not_found: missing chat returns proper error", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const chatId = faker.string.uuid();
		const messageId = faker.string.uuid();

		const res = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId, messageId } },
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		const chatIssues = res.errors?.[0]?.extensions?.issues as
			| Array<{ argumentPath: Array<string> }>
			| undefined;
		expect(chatIssues).toBeDefined();
		if (!chatIssues || chatIssues.length === 0) {
			throw new Error("expected an issues array with at least one element");
		}
		const chatIssuesArr = chatIssues as Array<{ argumentPath: Array<string> }>;
		expect(
			chatIssuesArr.some((i) => i.argumentPath.join(".") === "input.chatId"),
		).toBe(true);
	});

	test("arguments_associated_resources_not_found: missing message returns proper error", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const memberRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(memberRes.data?.createUser);
		const member = memberRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: member.user?.id } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: member.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: {
				input: {
					name: `msg-missing-${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, memberId: member.user?.id } },
		});
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChatMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { chatId, memberId: member.user?.id } },
			});
		});

		const missingMessageId = faker.string.uuid();

		const res = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, messageId: missingMessageId } },
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		const msgIssues = res.errors?.[0]?.extensions?.issues as
			| Array<{ argumentPath: Array<string> }>
			| undefined;
		expect(msgIssues).toBeDefined();
		if (!msgIssues || msgIssues.length === 0) {
			throw new Error("expected an issues array with at least one element");
		}
		const msgIssuesArr = msgIssues as Array<{ argumentPath: Array<string> }>;
		expect(
			msgIssuesArr.some((i) => i.argumentPath.join(".") === "input.messageId"),
		).toBe(true);
	});

	test("user not found: token for deleted user results in unauthenticated", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const tmpRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(tmpRes.data?.createUser);
		const tmpUser = tmpRes.data.createUser;
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: tmpUser.user?.id } },
		});

		const res = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${tmpUser.authenticationToken}` },
			variables: {
				input: { chatId: faker.string.uuid(), messageId: faker.string.uuid() },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("unauthorized: non-member cannot mark chat as read", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const outsiderRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(outsiderRes.data?.createUser);
		const outsider = outsiderRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: outsider.user?.id } },
			});
		});

		const memberRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(memberRes.data?.createUser);
		const member = memberRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: member.user?.id } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: member.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: {
				input: {
					name: `unauth-test-${faker.string.uuid()}`,
					organizationId: orgId,
				},
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, memberId: member.user?.id } },
		});

		const messageRes = await mercuriusClient.mutate(
			Mutation_createChatMessage,
			{
				headers: { authorization: `bearer ${member.authenticationToken}` },
				variables: { input: { chatId, body: "hello outsider" } },
			},
		);
		assertToBeNonNullish(messageRes.data?.createChatMessage);
		const messageId = messageRes.data.createChatMessage.id;

		const markRes = await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${outsider.authenticationToken}` },
			variables: { input: { chatId, messageId } },
		});
		expect(markRes.errors).toBeDefined();
		expect(markRes.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});
});
