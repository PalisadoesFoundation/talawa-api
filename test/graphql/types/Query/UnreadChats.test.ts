/**
 * Integration tests for the `unreadChats` query.
 *
 * Behaviour under test (server-side):
 * - Only authenticated users may query `unreadChats` (unauthenticated -> unauthenticated error).
 * - The resolver returns chats where the current user is a chat member AND there exists
 *   at least one message with createdAt > COALESCE(membership.lastReadAt, epoch).
 * - Non-members (users who are not members of a chat) will not receive that chat in
 *   the `unreadChats` list.
 *
 * This file mirrors the testing style used elsewhere in the suite: strict TypeScript
 * guards via `assertToBeNonNullish`, `cleanupFns` with `afterEach` teardown, and
 * deterministic sign-in where needed.
 */

import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
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
	Query_unreadChats,
} from "../documentNodes";

suite("Query: unreadChats", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (_err) {
				console.error(_err);
			}
		}
		cleanupFns.length = 0;
	});

	beforeAll(async () => {
		if (!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error("admin env not set");
		}
	});

	test("returns chats where member has unread messages", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		// create two users: member and outsider
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
		assertToBeNonNullish(member.user);
		assertToBeNonNullish(member.user.id);
		assertToBeNonNullish(member.user.emailAddress);
		const memberId = member.user.id;
		const memberEmail = member.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberId } },
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
		assertToBeNonNullish(outsider.user);
		assertToBeNonNullish(outsider.user.id);
		assertToBeNonNullish(outsider.user.emailAddress);
		const outsiderId = outsider.user.id;
		const outsiderEmail = outsider.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: outsiderId } },
			});
		});

		// create organization and add member (not outsider)
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
					memberId: memberId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		// member creates a chat and adds member
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

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, memberId: memberId } },
		});

		// create two messages (newest message should be unread)
		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, body: "m1" } },
		});
		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, body: "m2" } },
		});

		// Now query unreadChats as the member. Should include the chat.
		const memberResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: memberEmail, password: "password123" },
		});
		const memberCookie = memberResponse.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		assertToBeNonNullish(memberCookie?.value);
		const memberToken = memberCookie.value;

		const unreadRes = await mercuriusClient.query(Query_unreadChats, {
			headers: { authorization: `bearer ${memberToken}` },
		});
		assertToBeNonNullish(unreadRes.data?.unreadChats);
		const unreadList = unreadRes.data.unreadChats;
		expect(unreadList.some((c: { id: string }) => c.id === chatId)).toBe(true);

		// Query as outsider: outsider is not a member, unreadChats should not include the chat
		const outsiderResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: outsiderEmail, password: "password123" },
		});
		const outsiderCookie = outsiderResponse.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		assertToBeNonNullish(outsiderCookie?.value);
		const outsiderToken = outsiderCookie.value;

		const outsiderUnread = await mercuriusClient.query(Query_unreadChats, {
			headers: { authorization: `bearer ${outsiderToken}` },
		});
		assertToBeNonNullish(outsiderUnread.data?.unreadChats);
		const outsiderList = outsiderUnread.data.unreadChats;
		expect(outsiderList.some((c: { id: string }) => c.id === chatId)).toBe(
			false,
		);
	});

	test("does not count chats where lastReadAt is newer than messages", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

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
		assertToBeNonNullish(user.user);
		assertToBeNonNullish(user.user.id);
		assertToBeNonNullish(user.user.emailAddress);
		const userId = user.user.id;
		const userEmail = user.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
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
					memberId: userId,
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

		// Ensure the user is a member of the chat (deterministic for tests).
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${user.authenticationToken}` },
			variables: { input: { chatId, memberId: userId } },
		});

		// create a message and then update membership.lastReadAt to be after it by
		// marking the chat as read (use the markChatAsRead mutation indirectly via
		// creating a membership and then updating lastReadAt - markChatAsRead exists
		// but we avoid changing business logic here; instead ensure membership
		// lastReadAt is set by using the markChatAsRead mutation if available elsewhere.
		const msgRes = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${user.authenticationToken}` },
			variables: { input: { chatId, body: "onlyMessage" } },
		});
		assertToBeNonNullish(msgRes.data?.createChatMessage);
		const messageId = msgRes.data.createChatMessage.id;

		// sign the user in and call unreadChats; because lastReadAt defaults to epoch,
		// unreadChats will include the chat. To simulate lastReadAt after message we
		// rely on the markChatAsRead mutation elsewhere; however to keep tests self
		// contained and avoid modifying business logic we will instead verify that
		// unreadChats does not include chats when membership.lastReadAt is manually
		// updated by calling the markChatAsRead mutation (this exists in document
		// nodes and is part of the public API).

		// sign in user
		const userSignInResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: userEmail, password: "password123" },
		});
		const userCookie = userSignInResponse.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		assertToBeNonNullish(userCookie?.value);
		const userToken = userCookie.value;

		// mark chat as read (set lastReadAt to latest message)
		// Use existing public mutation document node to avoid touching server code.
		// Note: Mutation_markChatAsRead is available in documentNodes.
		await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { chatId, messageId } },
		});

		const res = await mercuriusClient.query(Query_unreadChats, {
			headers: { authorization: `bearer ${userToken}` },
		});
		// unreadChats should be an array and should not include the chat we just marked read
		assertToBeNonNullish(res.data?.unreadChats);
		const afterList = res.data.unreadChats;
		expect(afterList.some((c: { id: string }) => c.id === chatId)).toBe(false);
	});

	test("unauthenticated access returns unauthenticated error", async () => {
		const res = await mercuriusClient.query(Query_unreadChats);
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});
});
