import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
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
	Mutation_updateChatMembership,
	Query_signIn,
} from "../documentNodes";

describe("Mutation: updateChatMembership", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {}
		}
		cleanupFns.length = 0;
	});

	test("cannot set non-regular role when actor is not org member", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

		const actorRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(actorRes.data?.createUser);
		const actor = actorRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: actor.user?.id } },
			});
		});

		const targetRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(targetRes.data?.createUser);
		const target = targetRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: target.user?.id } },
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

		const targetSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: target.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(targetSignIn.data?.signIn?.authenticationToken);
		const targetToken = targetSignIn.data.signIn.authenticationToken as string;

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: target.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${targetToken}` },
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

		const targetMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: { input: { chatId, memberId: target.user?.id } },
			},
		);
		assertToBeNonNullish(targetMembershipRes.data?.createChatMembership);

		const actorMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: { input: { chatId, memberId: actor.user?.id } },
			},
		);
		assertToBeNonNullish(actorMembershipRes.data?.createChatMembership);

		const actorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: actor.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(actorSignIn.data?.signIn?.authenticationToken);
		const actorToken = actorSignIn.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${actorToken}` },
			variables: {
				input: { chatId, memberId: target.user?.id, role: "administrator" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("returns arguments_associated_resources_not_found when member not in chat", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

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
		const creator = creatorRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creator.user?.id } },
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

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data.signIn
			.authenticationToken as string;

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creator.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
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

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${outsiderToken}` },
			variables: {
				input: { chatId, memberId: outsider.user?.id, role: "regular" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("invalid arguments: malformed UUID yields invalid_arguments", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: "not-a-uuid",
					memberId: "also-not-a-uuid",
					role: "regular",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	beforeAll(async () => {
		if (!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error("admin env not set");
		}
	});

	test("unauthenticated requests are denied", async () => {
		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			variables: {
				input: {
					chatId: "not-a-uuid",
					memberId: "not-a-uuid",
					role: "regular",
				},
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("arguments associated resources not found when chat/member missing", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

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

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: "00000000-0000-0000-0000-000000000000",
					memberId: user.user?.id,
					role: "regular",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("unauthorized when non-admin non-owner tries to update role", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

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
		const creator = creatorRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creator.user?.id } },
			});
		});

		const victimRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(victimRes.data?.createUser);
		const victim = victimRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: victim.user?.id } },
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
					memberId: creator.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: victim.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const creatorSignInRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(creatorSignInRes.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignInRes.data.signIn
			.authenticationToken as string;

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
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

		const creatorMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${creatorToken}` },
				variables: { input: { chatId, memberId: creator.user?.id } },
			},
		);
		assertToBeNonNullish(creatorMembershipRes.data?.createChatMembership);

		const victimMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${creatorToken}` },
				variables: { input: { chatId, memberId: victim.user?.id } },
			},
		);
		assertToBeNonNullish(victimMembershipRes.data?.createChatMembership);

		const victimSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: victim.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(victimSignIn.data?.signIn?.authenticationToken);
		const victimToken = victimSignIn.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${victimToken}` },
			variables: {
				input: { chatId, memberId: creator.user?.id, role: "administrator" },
			},
		});
		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("administrator can update another member's role", async () => {
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

		const targetRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(targetRes.data?.createUser);
		const target = targetRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: target.user?.id } },
			});
		});

		const approverRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(approverRes.data?.createUser);
		const approver = approverRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: approver.user?.id } },
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
					memberId: target.user?.id,
					organizationId: orgId,
					role: "administrator",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: approver.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const targetSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: target.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(targetSignIn.data?.signIn?.authenticationToken);
		const targetToken = targetSignIn.data.signIn.authenticationToken as string;

		const approverSignInForCreate = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: approver.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(
			approverSignInForCreate.data?.signIn?.authenticationToken,
		);

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${targetToken}` },
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

		const targetMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: {
					input: { chatId, memberId: target.user?.id, role: "administrator" },
				},
			},
		);
		assertToBeNonNullish(targetMembershipRes.data?.createChatMembership);

		const approverMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: {
					input: { chatId, memberId: approver.user?.id, role: "regular" },
				},
			},
		);
		assertToBeNonNullish(approverMembershipRes.data?.createChatMembership);

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${targetToken}` },
			variables: {
				input: { chatId, memberId: approver.user?.id, role: "administrator" },
			},
		});
		expect(res.errors).toBeUndefined();
		const updated = res.data?.updateChatMembership;
		assertToBeNonNullish(updated);
		expect(updated.id).toBeDefined();
	});

	test('returns "unexpected" when update returns no rows', async () => {
		// sign in as admin
		const admin = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(admin.data?.signIn?.authenticationToken);
		const adminToken = admin.data.signIn.authenticationToken as string;

		// create user and org and chat + memberships so update would normally succeed
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

		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
		const token = signIn.data.signIn.authenticationToken as string;

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${token}` },
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

		const memRes = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: { chatId, memberId: user.user?.id, role: "regular" },
			},
		});
		assertToBeNonNullish(memRes.data?.createChatMembership);

		// Mock update to return empty array from returning()
		const originalUpdate = server.drizzleClient.update;
		server.drizzleClient.update = vi.fn().mockImplementation(() => ({
			set: () => ({
				where: () => ({ returning: () => Promise.resolve([]) }),
			}),
		}));

		try {
			const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: { chatId, memberId: user.user?.id, role: "administrator" },
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		} finally {
			server.drizzleClient.update = originalUpdate;
		}
	});
});
