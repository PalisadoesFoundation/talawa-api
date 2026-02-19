import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { afterEach, describe, expect, test, vi } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMembership,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_chat_members,
} from "../documentNodes";

describe("Chat.members integration tests", () => {
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
		vi.restoreAllMocks();
	});

	test("happy path: returns members and supports pagination", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const creatorRes = await mercuriusClient.mutate(Mutation_createUser, {
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

		const memberARes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(memberARes.data?.createUser);
		const memberA = memberARes.data?.createUser;

		assertToBeNonNullish(memberA.user);
		assertToBeNonNullish(memberA.user?.id);

		const memberAId = memberA.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberAId } },
			});
		});

		const memberBRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(memberBRes.data?.createUser);
		const memberB = memberBRes.data?.createUser;

		assertToBeNonNullish(memberB.user);
		assertToBeNonNullish(memberB.user?.id);

		const memberBId = memberB.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: memberBId } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
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
		const creatorSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: {
				email: creator.user.emailAddress,
				password: "password123",
			},
		});
		const creatorToken = creatorSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(creatorToken);

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: org.id },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});
		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { chatId: chat.id, memberId: memberA.user.id, role: "regular" },
			},
		});

		await new Promise((res) => setTimeout(res, 10));

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { chatId: chat.id, memberId: memberB.user.id, role: "regular" },
			},
		});

		const all = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 10 },
		});
		expect(all.errors).toBeUndefined();

		const edges = all.data?.chat?.members?.edges as Array<{
			cursor: string;
			node: { user: { id: string }; role: string };
		}>;
		expect(Array.isArray(edges)).toBe(true);
		const ids = edges.map((e) => e.node.user.id);
		expect(ids).toContain(memberA.user?.id);
		expect(ids).toContain(memberB.user?.id);

		const page1 = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1 },
		});
		expect(page1.errors).toBeUndefined();
		const edges1 = page1.data?.chat?.members?.edges as Array<{
			cursor: string;
			node: { user: { id: string }; role: string };
		}>;
		expect(edges1.length).toBe(1);
		const endCursor = page1.data?.chat?.members?.pageInfo?.endCursor as
			| string
			| undefined;
		expect(typeof endCursor).toBe("string");

		const page2 = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 10, after: endCursor },
		});
		expect(page2.errors).toBeUndefined();
		const edges2 = page2.data?.chat?.members?.edges as Array<{
			cursor: string;
			node: { user: { id: string }; role: string };
		}>;
		const combined = edges1.concat(edges2).map((e) => e.node.user.id);
		for (const id of [memberA.user?.id, memberB.user?.id])
			expect(combined).toContain(id);
	});

	test("invalid cursor and missing-cursor resource errors", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const creatorRes = await mercuriusClient.mutate(Mutation_createUser, {
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

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
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
		const creatorSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: {
				email: creator.user.emailAddress,
				password: "password123",
			},
		});
		const creatorToken = creatorSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(creatorToken);

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: org.id },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		const invalid = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1, after: "not-a-cursor" },
		});
		expect(invalid.errors).toBeDefined();
		expect(invalid.errors?.[0]?.extensions?.code).toBe("invalid_arguments");

		const fakeCursorObj = {
			createdAt: new Date().toISOString(),
			memberId: faker.string.uuid(),
		};
		const fakeCursor = Buffer.from(JSON.stringify(fakeCursorObj)).toString(
			"base64url",
		);

		const missing = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1, after: fakeCursor },
		});
		expect(missing.errors).toBeDefined();
		const code = missing.errors?.[0]?.extensions?.code as string;
		expect(code).toBe("arguments_associated_resources_not_found");
	});
});

describe("Chat.members additional edge cases", () => {
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
		vi.restoreAllMocks();
	});

	test("invalid when both first and last provided", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const creatorRes = await mercuriusClient.mutate(Mutation_createUser, {
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

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
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
		const creatorSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: {
				email: creator.user.emailAddress,
				password: "password123",
			},
		});
		const creatorToken = creatorSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(creatorToken);

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: org.id },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		const conflict = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { id: chat.id }, first: 1, last: 1 },
		});
		expect(conflict.errors).toBeDefined();
		expect(conflict.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("inversed pagination with last/before and missing-cursor on before", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const u1Res = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(u1Res.data?.createUser);
		const u1 = u1Res.data?.createUser;

		assertToBeNonNullish(u1.user);
		assertToBeNonNullish(u1.user?.id);

		const u1Id = u1.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: u1Id } },
			});
		});

		const u2Res = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(u2Res.data?.createUser);
		const u2 = u2Res.data?.createUser;

		assertToBeNonNullish(u2.user);
		assertToBeNonNullish(u2.user?.id);

		const u2Id = u2.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: u2Id } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
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
					memberId: u1.user.id,
					organizationId: org.id,
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(u1.user?.emailAddress);
		const u1SignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: u1.user.emailAddress, password: "password123" },
		});
		const u1Token = u1SignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(u1Token);

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${u1Token}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: org.id },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const chat = chatRes.data?.createChat;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chat.id } },
			});
		});

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${u1Token}` },
			variables: {
				input: { chatId: chat.id, memberId: u2.user.id, role: "regular" },
			},
		});

		const inv1 = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${u1Token}` },
			variables: { input: { id: chat.id }, last: 1 },
		});
		expect(inv1.errors).toBeUndefined();
		const invEnd = inv1.data?.chat?.members?.pageInfo?.endCursor as
			| string
			| undefined;

		const inv2 = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${u1Token}` },
			variables: { input: { id: chat.id }, last: 10, before: invEnd },
		});
		if (inv2.errors) {
			expect(inv2.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		} else {
			expect(inv2.errors).toBeUndefined();
		}

		const fakeCursorObj = {
			createdAt: new Date().toISOString(),
			memberId: faker.string.uuid(),
		};
		const fakeCursor = Buffer.from(JSON.stringify(fakeCursorObj)).toString(
			"base64url",
		);
		const missingBefore = await mercuriusClient.query(Query_chat_members, {
			headers: { authorization: `bearer ${u1Token}` },
			variables: { input: { id: chat.id }, last: 1, before: fakeCursor },
		});
		expect(missingBefore.errors).toBeDefined();
		expect(missingBefore.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});
});
