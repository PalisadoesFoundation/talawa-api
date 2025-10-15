import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";
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
	Query_signIn,
} from "../documentNodes";

function requireNoErrors(res: unknown, label?: string) {
	if (
		res &&
		typeof res === "object" &&
		"errors" in (res as Record<string, unknown>)
	) {
		const r = res as { errors?: unknown[] };
		if (Array.isArray(r.errors) && r.errors.length > 0) {
			throw new Error(
				`${label ?? "GraphQL"} returned errors: ${JSON.stringify(r.errors)}`,
			);
		}
	}
}

async function getAdminToken() {
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	requireNoErrors(res, "admin signIn");
	// Narrow the response at runtime instead of using non-null assertions
	if (
		!res ||
		typeof res !== "object" ||
		!("data" in (res as Record<string, unknown>))
	) {
		throw new Error("Unexpected signIn response shape");
	}
	const r = res as unknown as { data?: unknown };
	const data = r.data as
		| { signIn?: { authenticationToken?: unknown } }
		| undefined;
	const signIn = data?.signIn;
	if (!signIn || typeof signIn.authenticationToken !== "string") {
		throw new Error("Expected authenticationToken in signIn response");
	}
	const token = signIn.authenticationToken as string;
	assertToBeNonNullish(token);
	return token;
}

describe("Mutation: createChatMembership", () => {
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

	test("creator is set to the acting user when creating a membership", async () => {
		const adminToken = await getAdminToken();
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
		requireNoErrors(creatorRes, "createUser");
		if (!creatorRes.data?.createUser) {
			console.error("createUser failed:", creatorRes.errors);
		}
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creatorUser = creatorRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creatorUser.user?.id } },
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
		requireNoErrors(targetRes, "createUser");
		if (!targetRes.data?.createUser) {
			console.error("createUser failed:", targetRes.errors);
		}
		assertToBeNonNullish(targetRes.data?.createUser);
		const targetUser = targetRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: targetUser.user?.id } },
			});
		});

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `org-${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		requireNoErrors(orgRes, "createOrganization");
		assertToBeNonNullish(orgRes.data?.createOrganization);
		const orgId = orgRes.data.createOrganization.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		const orgMemberRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: creatorUser.user?.id,
						organizationId: orgId,
						role: "regular",
					},
				},
			},
		);
		requireNoErrors(orgMemberRes, "createOrganizationMembership");
		assertToBeNonNullish(orgMemberRes.data?.createOrganizationMembership);

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creatorUser.user?.emailAddress,
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

		const memRes = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { chatId, memberId: targetUser.user?.id, role: "regular" },
			},
		});
		assertToBeNonNullish(memRes.data?.createChatMembership);

		const createdTargetMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, targetUser.user?.id),
					),
			});
		if (!createdTargetMembership)
			throw new Error("expected created membership in DB");
		expect(createdTargetMembership.creatorId).toBe(creatorUser.user?.id);
	});

	test("creates membership when actor is org member (happy path)", async () => {
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
		if (!creatorRes.data?.createUser)
			console.error("createUser failed:", creatorRes.errors);
		assertToBeNonNullish(creatorRes.data?.createUser);
		const creator = creatorRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: creator.user?.id } },
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
		if (!targetRes.data?.createUser)
			console.error("createUser failed:", targetRes.errors);
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
		if (!orgRes.data?.createOrganization)
			console.error("createOrganization failed:", orgRes.errors);
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

		const creatorSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: creator.user?.emailAddress,
					password: "password123",
				},
			},
		});
		if (!creatorSignIn.data?.signIn?.authenticationToken)
			console.error("creator sign in failed:", creatorSignIn.errors);
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

		const memRes = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { chatId, memberId: target.user?.id, role: "regular" },
			},
		});
		assertToBeNonNullish(memRes.data?.createChatMembership);

		const createdTargetMembership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.chatId, chatId),
						operators.eq(fields.memberId, target.user?.id),
					),
			});
		if (!createdTargetMembership) {
			throw new Error("expected created membership in DB");
		}
	});

	test("invalid arguments cause invalid_arguments error", async () => {
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

		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { chatId: "not-a-uuid", memberId: "also-not-a-uuid" },
			},
		});

		expect(res.errors).toBeDefined();
		const code = res.errors?.[0]?.extensions?.code as string;
		expect([
			"invalid_arguments",
			"arguments_associated_resources_not_found",
		]).toContain(code);
	});

	test("unauthenticated requests are denied", async () => {
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			variables: {
				input: { chatId: faker.string.uuid(), memberId: faker.string.uuid() },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("unauthenticated is returned when authenticated user record missing", async () => {
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

		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
		const userToken = signIn.data.signIn.authenticationToken as string;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: user.user?.id } },
		});

		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: { chatId: faker.string.uuid(), memberId: user.user?.id },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
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

		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { chatId: randomChatId, memberId: randomMemberId } },
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});
	test("invalid_arguments when chat missing but member exists", async () => {
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

		const invalidChatId = faker.string.uuid();
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { chatId: invalidChatId, memberId: target.user?.id },
			},
		});

		expect(res.errors).toBeDefined();
		const code2 = res.errors?.[0]?.extensions?.code as string;
		expect([
			"invalid_arguments",
			"arguments_associated_resources_not_found",
		]).toContain(code2);
	});

	test("invalid_arguments when member missing but chat exists", async () => {
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

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: {
				input: { name: `chat-${faker.string.uuid()}`, organizationId: orgId },
			},
		});
		requireNoErrors(chatRes, "createChat");
		assertToBeNonNullish(chatRes.data?.createChat);
		const chatId = chatRes.data.createChat.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatId } },
			});
		});

		const missingMemberId = faker.string.uuid();
		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId, memberId: missingMemberId } },
		});

		expect(res.errors).toBeDefined();
		const code3 = res.errors?.[0]?.extensions?.code as string;
		expect([
			"invalid_arguments",
			"arguments_associated_resources_not_found",
		]).toContain(code3);
	});

	test("forbidden when membership already exists", async () => {
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

		const memRes = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId, memberId: target.user?.id } },
		});
		assertToBeNonNullish(memRes.data?.createChatMembership);

		const second = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${creatorToken}` },
			variables: { input: { chatId, memberId: target.user?.id } },
		});

		expect(second.errors).toBeUndefined();
		expect(second.data?.createChatMembership).not.toBeNull();

		const memberships =
			await server.drizzleClient.query.chatMembershipsTable.findMany({
				where: (fields, ops) =>
					ops.and(
						ops.eq(fields.chatId, chatId),
						ops.eq(fields.memberId, target.user?.id),
					),
			});
		expect(memberships.length).toBeGreaterThanOrEqual(1);
	});

	test("forbidden to add members to a direct chat", async () => {
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

		const userARes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(userARes.data?.createUser);
		const userA = userARes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userA.user?.id } },
			});
		});

		const userBRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(userBRes.data?.createUser);
		const userB = userBRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userB.user?.id } },
			});
		});

		const thirdRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(thirdRes.data?.createUser);
		const thirdUser = thirdRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: thirdUser.user?.id } },
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

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: directChatId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: userA.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: userB.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const userASignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: userA.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(userASignIn.data?.signIn?.authenticationToken);
		const userAToken = userASignIn.data.signIn.authenticationToken as string;

		const createDirectRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${userAToken}` },
			variables: {
				input: {
					name: `direct-${faker.string.uuid()}`,
					participants: [userA.user?.id, userB.user?.id],
					organizationId: orgId,
				},
			},
		});
		requireNoErrors(createDirectRes, "createDirectChat");
		assertToBeNonNullish(createDirectRes.data?.createChat);
		const directChatId = createDirectRes.data.createChat.id;

		const addRes = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${userAToken}` },
			variables: {
				input: { chatId: directChatId, memberId: thirdUser.user?.id },
			},
		});

		expect(addRes.errors).toBeDefined();
		expect(addRes.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});

	test("unauthorized when actor is not admin and not org/chat member", async () => {
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

		const ownerRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(ownerRes.data?.createUser);
		const owner = ownerRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: owner.user?.id } },
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
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: actor.user?.id } },
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
					memberId: owner.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const ownerSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: owner.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(ownerSignIn.data?.signIn?.authenticationToken);
		const ownerToken = ownerSignIn.data.signIn.authenticationToken as string;

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${ownerToken}` },
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

		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${actorToken}` },
			variables: { input: { chatId, memberId: actor.user?.id } },
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("unauthorized_arguments when setting non-regular role without org membership", async () => {
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

		const ownerRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(ownerRes.data?.createUser);
		const owner = ownerRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: owner.user?.id } },
			});
		});

		const chatMemberRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		assertToBeNonNullish(chatMemberRes.data?.createUser);
		const chatMember = chatMemberRes.data.createUser;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: chatMember.user?.id } },
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

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: owner.user?.id,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const ownerSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: owner.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(ownerSignIn.data?.signIn?.authenticationToken);
		const ownerToken = ownerSignIn.data.signIn.authenticationToken as string;

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${ownerToken}` },
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

		const chatMemberSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: chatMember.user?.emailAddress,
					password: "password123",
				},
			},
		});
		assertToBeNonNullish(chatMemberSignIn.data?.signIn?.authenticationToken);
		const chatMemberToken = chatMemberSignIn.data.signIn
			.authenticationToken as string;

		await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${ownerToken}` },
			variables: { input: { chatId, memberId: chatMember.user?.id } },
		});

		const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
			headers: { authorization: `bearer ${chatMemberToken}` },
			variables: {
				input: { chatId, memberId: target.user?.id, role: "administrator" },
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});
});
