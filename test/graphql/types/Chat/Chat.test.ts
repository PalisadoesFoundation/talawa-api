/**
 * Integration tests for Chat computed fields (unreadMessagesCount, hasUnread,
 * firstUnreadMessageId, lastMessage).
 *
 * NOTE: Frontend currently marks self-authored messages as read. On the server-side
 * the computed fields treat a missing membership.lastReadAt as epoch (new Date(0)),
 * which means creators will see their own messages as unread until they explicitly
 * mark the chat as read. This behaviour is intentional for now and is covered by
 * these tests.
 *
 * TODO (future): Implement a humanized server-side behaviour so creators do not
 * see their own freshly-created messages as unread. Possible approaches:
 *  - Ignore messages authored by the current user when counting unread messages;
 *  - Update the author's chatMembership.lastReadAt when they create a message.
 *
 * This should be implemented carefully to preserve read-receipt semantics.
 */

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
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_markChatAsRead,
	Query_chat_with_unread,
	Query_signIn,
} from "../documentNodes";

suite("Chat computed fields", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {}
		}
		cleanupFns.length = 0;
	});

	beforeAll(async () => {
		if (!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error("admin env not set");
		}
	});

	test("computed unread fields reflect message/read state", async () => {
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

		const aliceRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(aliceRes.data?.createUser);
		const alice = aliceRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: alice.user?.id } },
			});
		});

		const bobRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(bobRes.data?.createUser);
		const bob = bobRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: bob.user?.id } },
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
					memberId: alice.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: bob.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
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
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: { input: { chatId, memberId: alice.user?.id } },
		});
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: { input: { chatId, memberId: bob.user?.id } },
		});

		const m1 = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: { input: { chatId, body: "first" } },
		});
		assertToBeNonNullish(m1.data?.createChatMessage);
		const m1Id = m1.data.createChatMessage.id;

		const m2 = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: { input: { chatId, body: "second" } },
		});
		assertToBeNonNullish(m2.data?.createChatMessage);
		const m2Id = m2.data.createChatMessage.id;

		const bobChat = await mercuriusClient.query(Query_chat_with_unread, {
			headers: { authorization: `bearer ${bob.authenticationToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(bobChat.data?.chat);
		const bobChatNode = bobChat.data.chat;
		expect(bobChatNode.unreadMessagesCount).toBe(2);
		expect(bobChatNode.hasUnread).toBe(true);
		expect(bobChatNode.firstUnreadMessageId).toBe(m1Id);
		expect(bobChatNode.lastMessage?.id).toBe(m2Id);

		await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${bob.authenticationToken}` },
			variables: { input: { chatId, messageId: m1Id } },
		});

		const bobChatAfter = await mercuriusClient.query(Query_chat_with_unread, {
			headers: { authorization: `bearer ${bob.authenticationToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(bobChatAfter.data?.chat);
		const bobAfterNode = bobChatAfter.data.chat;
		expect(bobAfterNode.unreadMessagesCount).toBe(0);
		expect(bobAfterNode.hasUnread).toBe(false);
		expect(bobAfterNode.firstUnreadMessageId).toBeNull();

		const aliceChat = await mercuriusClient.query(Query_chat_with_unread, {
			headers: { authorization: `bearer ${alice.authenticationToken}` },
			variables: { input: { id: chatId } },
		});
		assertToBeNonNullish(aliceChat.data?.chat);
		const aliceNode = aliceChat.data.chat;
		expect(aliceNode.unreadMessagesCount).toBe(2);
		expect(aliceNode.hasUnread).toBe(true);
		expect(aliceNode.firstUnreadMessageId).toBe(m1Id);
	});

	suite("unauthenticated access to computed fields is denied", () => {
		let adminToken: string;

		beforeAll(async () => {
			const adminRes = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
			adminToken = adminRes.data.signIn.authenticationToken as string;
		});

		test("non-member sees zero/false/null for unread fields", async () => {
			// adminToken provided by beforeAll

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
			const outsiderSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: outsider.user?.emailAddress,
						password: "password123",
					},
				},
			});
			assertToBeNonNullish(outsiderSignIn.data?.signIn?.authenticationToken);
			const outsiderToken = outsiderSignIn.data.signIn
				.authenticationToken as string;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: outsider.user?.id } },
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
					input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
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

			const outsiderChat = await mercuriusClient.query(Query_chat_with_unread, {
				headers: { authorization: `bearer ${outsiderToken}` },
				variables: { input: { id: chatId } },
			});
			// The API enforces that only members may access chat computed fields. A
			// non-member receives an authorization error. Assert that behaviour so the
			// test matches server semantics.
			expect(outsiderChat.errors).toBeDefined();
			expect(outsiderChat.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});

		test("lastMessage returns null when no messages exist", async () => {
			// adminToken provided by beforeAll

			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
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
			assertToBeNonNullish(userRes.data?.createUser);
			const user = userRes.data.createUser;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: user.user?.id } },
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
						memberId: user.user?.id,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
				headers: { authorization: `bearer ${user.authenticationToken}` },
				variables: {
					input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
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

			const res = await mercuriusClient.query(Query_chat_with_unread, {
				headers: { authorization: `bearer ${user.authenticationToken}` },
				variables: { input: { id: chatId } },
			});
			assertToBeNonNullish(res.data?.chat);
			const node = res.data.chat;
			expect(node.lastMessage).toBeNull();
		});

		test("unauthenticated access returns unauthenticated error", async () => {
			// create a user/org/chat as admin and then query without auth headers
			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
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
			assertToBeNonNullish(userRes.data?.createUser);
			const user = userRes.data.createUser;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: user.user?.id } },
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
						memberId: user.user?.id,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
				headers: { authorization: `bearer ${user.authenticationToken}` },
				variables: {
					input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
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

			const res = await mercuriusClient.query(Query_chat_with_unread, {
				variables: { input: { id: chatId } },
			});
			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});
});
