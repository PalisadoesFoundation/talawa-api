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
			} catch (err) {
				console.warn("cleanup error:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("chat-local admin (not org member) cannot set non-regular role (role argument issue)", async () => {
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
		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user.id);
		const creatorId = creator.user.id;
		assertToBeNonNullish(creator.user.emailAddress);
		const creatorEmail = creator.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
			});
		});

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
		assertToBeNonNullish(actor.user);
		assertToBeNonNullish(actor.user.id);
		const actorId = actor.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: actorId } },
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
		assertToBeNonNullish(target.user);
		assertToBeNonNullish(target.user.id);
		const targetId = target.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: targetId } },
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
					memberId: creatorId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creatorEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data.signIn
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

		const targetMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${creatorToken}` },
				variables: {
					input: { chatId, memberId: targetId, role: "regular" },
				},
			},
		);
		assertToBeNonNullish(targetMembershipRes.data?.createChatMembership);

		const createdTargetMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, targetId),
					),
			});
		if (!createdTargetMembership) {
			throw new Error("expected created target membership to exist in DB");
		}

		const actorMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${creatorToken}` },
				variables: {
					input: { chatId, memberId: actorId, role: "administrator" },
				},
			},
		);
		assertToBeNonNullish(actorMembershipRes.data?.createChatMembership);

		// double-check actor membership exists in DB as well
		const createdActorMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, actorId),
					),
			});
		if (!createdActorMembership) {
			throw new Error("expected created actor membership to exist in DB");
		}

		// Use system administrator token to attempt the role change; admin is not added to the org so
		// the resolver will reach the role-specific unauthorized branch that flags the role argument.
		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { chatId, memberId: targetId, role: "administrator" },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
		const issues = res.errors?.[0]?.extensions?.issues;
		expect(Array.isArray(issues)).toBe(true);
		type IssueShape = { argumentPath?: unknown[] };
		const issuePaths: Array<unknown> = Array.isArray(issues)
			? (issues as IssueShape[]).map((issue) => issue.argumentPath)
			: [];
		expect(issuePaths).toContainEqual(["input", "role"]);
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
		assertToBeNonNullish(actor.user);
		assertToBeNonNullish(actor.user.id);
		const actorId = actor.user.id;
		assertToBeNonNullish(actor.user.emailAddress);
		const actorEmail = actor.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: actorId } },
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
		assertToBeNonNullish(target.user);
		assertToBeNonNullish(target.user.id);
		const targetId = target.user.id;
		assertToBeNonNullish(target.user.emailAddress);
		const targetEmail = target.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: targetId } },
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
					emailAddress: targetEmail,
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
					memberId: targetId,
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
				variables: { input: { chatId, memberId: targetId } },
			},
		);
		assertToBeNonNullish(targetMembershipRes.data?.createChatMembership);

		const actorMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: { input: { chatId, memberId: actorId } },
			},
		);
		assertToBeNonNullish(actorMembershipRes.data?.createChatMembership);

		const actorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: actorEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(actorSignIn.data?.signIn?.authenticationToken);
		const actorToken = actorSignIn.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${actorToken}` },
			variables: {
				input: { chatId, memberId: targetId, role: "administrator" },
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
		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user.id);
		const creatorId = creator.user.id;
		assertToBeNonNullish(creator.user.emailAddress);
		const creatorEmail = creator.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
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
		const outsiderId = outsider.user.id;
		assertToBeNonNullish(outsider.user.emailAddress);
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

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creatorEmail,
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
					memberId: creatorId,
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
					emailAddress: outsiderEmail,
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
				input: { chatId, memberId: outsiderId, role: "regular" },
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

	test("arguments_associated_resources_not_found when both chat and member missing", async () => {
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

		const randomChatId = faker.string.uuid();
		const randomMemberId = faker.string.uuid();

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: randomChatId,
					memberId: randomMemberId,
					role: "regular",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("unauthenticated when authenticated user record was deleted", async () => {
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

		// create a user and sign in as them
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
		const userId = user.user.id;
		assertToBeNonNullish(user.user.emailAddress);
		const userEmail = user.user.emailAddress;

		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: userEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
		const userToken = signIn.data.signIn.authenticationToken as string;

		// delete the user record using admin so the authenticated token no longer maps to a DB user
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: userId } },
		});

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					chatId: faker.string.uuid(),
					memberId: userId,
					role: "regular",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("arguments_associated_resources_not_found when member user record missing but chat exists", async () => {
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
		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user.id);
		const creatorId = creator.user.id;
		assertToBeNonNullish(creator.user.emailAddress);
		const creatorEmail = creator.user.emailAddress;
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
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// make creator a member of org so they can create a chat
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: creatorId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creatorEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(creatorSignIn.data?.signIn?.authenticationToken);
		const creatorToken = creatorSignIn.data.signIn
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

		// pick a memberId that does not exist
		const missingMemberId = faker.string.uuid();

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { chatId, memberId: missingMemberId, role: "regular" },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
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
		assertToBeNonNullish(user.user);
		assertToBeNonNullish(user.user.id);
		const userId = user.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					chatId: "00000000-0000-0000-0000-000000000000",
					memberId: userId,
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
		assertToBeNonNullish(creator.user);
		assertToBeNonNullish(creator.user.id);
		const creatorId = creator.user.id;
		assertToBeNonNullish(creator.user.emailAddress);
		const creatorEmail = creator.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorId } },
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
		assertToBeNonNullish(victim.user);
		assertToBeNonNullish(victim.user.id);
		const victimId = victim.user.id;
		assertToBeNonNullish(victim.user.emailAddress);
		const victimEmail = victim.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: victimId } },
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
					memberId: creatorId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: victimId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const creatorSignInRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creatorEmail,
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
				variables: { input: { chatId, memberId: creatorId } },
			},
		);
		assertToBeNonNullish(creatorMembershipRes.data?.createChatMembership);

		const victimMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${creatorToken}` },
				variables: { input: { chatId, memberId: victimId } },
			},
		);
		assertToBeNonNullish(victimMembershipRes.data?.createChatMembership);

		const victimSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: victimEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(victimSignIn.data?.signIn?.authenticationToken);
		const victimToken = victimSignIn.data.signIn.authenticationToken as string;

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${victimToken}` },
			variables: {
				input: { chatId, memberId: creatorId, role: "administrator" },
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
		assertToBeNonNullish(target.user);
		assertToBeNonNullish(target.user.id);
		const targetId = target.user.id;
		assertToBeNonNullish(target.user.emailAddress);
		const targetEmail = target.user.emailAddress;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: targetId } },
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
		assertToBeNonNullish(approver.user);
		assertToBeNonNullish(approver.user.id);
		const approverId = approver.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: approverId } },
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
					memberId: targetId,
					organizationId: orgId,
					role: "administrator",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: approverId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const targetSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: targetEmail,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(targetSignIn.data?.signIn?.authenticationToken);
		const targetToken = targetSignIn.data.signIn.authenticationToken as string;

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
					input: { chatId, memberId: targetId, role: "administrator" },
				},
			},
		);
		assertToBeNonNullish(targetMembershipRes.data?.createChatMembership);

		const approverMembershipRes = await mercuriusClient.mutate(
			Mutation_createChatMembership,
			{
				headers: { authorization: `bearer ${targetToken}` },
				variables: {
					input: { chatId, memberId: approverId, role: "regular" },
				},
			},
		);
		assertToBeNonNullish(approverMembershipRes.data?.createChatMembership);

		const res = await mercuriusClient.mutate(Mutation_updateChatMembership, {
			headers: { authorization: `bearer ${targetToken}` },
			variables: {
				input: { chatId, memberId: approverId, role: "administrator" },
			},
		});
		expect(res.errors).toBeUndefined();
		const updated = res.data?.updateChatMembership;
		assertToBeNonNullish(updated);
		expect(updated.id).toBeDefined();
	});

	test('returns "unexpected" when update returns no rows', async () => {
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
		assertToBeNonNullish(user.user);
		assertToBeNonNullish(user.user.id);
		const userId = user.user.id;
		assertToBeNonNullish(user.user.emailAddress);
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

		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: userEmail,
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
				input: { chatId, memberId: userId, role: "regular" },
			},
		});
		assertToBeNonNullish(memRes.data?.createChatMembership);

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
					input: { chatId, memberId: userId, role: "administrator" },
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		} finally {
			server.drizzleClient.update = originalUpdate;
		}
	});
});
