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
			} catch (err) {
				console.warn("cleanup error:", err);
			}
		}
		cleanupFns.length = 0;
	});

	beforeAll(async () => {
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
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
		assertToBeNonNullish(member.authenticationToken);
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
		assertToBeNonNullish(outsider.authenticationToken);
		const outsiderId = outsider.user.id;
		const outsiderEmail = outsider.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: outsiderId } },
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
					memberId: memberId,
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

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, memberId: memberId } },
		});

		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, body: "m1" } },
		});
		await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${member.authenticationToken}` },
			variables: { input: { chatId, body: "m2" } },
		});

		const memberSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: memberEmail, password: "password123" },
		});
		const memberToken = memberSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(memberToken);

		const unreadRes = await mercuriusClient.query(Query_unreadChats, {
			headers: { authorization: `bearer ${memberToken}` },
		});
		assertToBeNonNullish(unreadRes.data?.unreadChats);
		const unreadList = unreadRes.data.unreadChats;
		expect(unreadList.some((c: { id: string }) => c.id === chatId)).toBe(true);

		const outsiderSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: outsiderEmail, password: "password123" },
		});
		const outsiderToken = outsiderSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(outsiderToken);

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
		assertToBeNonNullish(user.authenticationToken);
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

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${user.authenticationToken}` },
			variables: { input: { chatId, memberId: userId } },
		});

		const msgRes = await mercuriusClient.mutate(Mutation_createChatMessage, {
			headers: { authorization: `bearer ${user.authenticationToken}` },
			variables: { input: { chatId, body: "onlyMessage" } },
		});
		assertToBeNonNullish(msgRes.data?.createChatMessage);
		const messageId = msgRes.data.createChatMessage.id;

		const userSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: userEmail, password: "password123" },
		});
		const userToken = userSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(userToken);

		await mercuriusClient.mutate(Mutation_markChatAsRead, {
			headers: { authorization: `bearer ${userToken}` },
			variables: { input: { chatId, messageId } },
		});

		const res = await mercuriusClient.query(Query_unreadChats, {
			headers: { authorization: `bearer ${userToken}` },
		});
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
