import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ChatMembershipResolver } from "~/src/graphql/types/Mutation/createChatMembership";
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

type MockParent = {
	id: string;
	chatId: string;
	creatorId: string;
	memberId: string;
};
type MockUser = { id: string };
type MockCtx = {
	currentClient: { isAuthenticated: boolean; user: MockUser };
	drizzleClient: {
		query: unknown;
		insert?: (...args: unknown[]) => unknown;
	};
	log: { error: (...args: unknown[]) => void };
};
type MockArgs = { input: { chatId: string; memberId: string; role?: string } };

type CreatorParentParam = Parameters<typeof ChatMembershipResolver.creator>[0];
type CreatorCtxParam = Parameters<typeof ChatMembershipResolver.creator>[2];
type CreateArgsParam = Parameters<
	typeof ChatMembershipResolver.createChatMembership
>[1];
type CreateCtxParam = Parameters<
	typeof ChatMembershipResolver.createChatMembership
>[2];

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

	test("creator resolver: forbidden when chat not found", async () => {
		const parent = {
			id: "m1",
			chatId: "chat-1",
			creatorId: "creator-1",
			memberId: "member-1",
		} as MockParent;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-1" } },
			drizzleClient: {
				query: {
					chatsTable: { findFirst: vi.fn().mockResolvedValue(undefined) },
					usersTable: { findFirst: vi.fn() },
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		await expect(
			ChatMembershipResolver.creator(
				parent as unknown as CreatorParentParam,
				{},
				ctx as unknown as CreatorCtxParam,
			),
		).rejects.toMatchObject({ extensions: { code: "forbidden_action" } });
	});

	test("creator returns current user when creatorId equals currentUserId", async () => {
		const parent = {
			creatorId: "actor-creator-1",
		} as unknown as CreatorParentParam;

		const args = {} as unknown as Parameters<
			typeof ChatMembershipResolver.creator
		>[1];

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-creator-1" } },
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi
							.fn()
							.mockResolvedValue({ id: "actor-creator-1", name: "Creator" }),
					},
					chatsTable: {
						findFirst: vi.fn().mockResolvedValue({
							id: faker.string.uuid(),
							organization: { membershipsWhereOrganization: [] },
						}),
					},
				},
			},
			log: { error: vi.fn() },
		} as unknown as CreatorCtxParam;

		const result = await ChatMembershipResolver.creator(parent, args, ctx);
		expect(result).toEqual({ id: "actor-creator-1", name: "Creator" });
	});

	test("creator resolver: returns null when creatorId falsy", async () => {
		const parent = {
			id: "m2",
			chatId: "chat-2",
			creatorId: "",
			memberId: "member-2",
		} as MockParent;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-2" } },
			drizzleClient: {
				query: {
					chatsTable: { findFirst: vi.fn().mockResolvedValue({}) },
					usersTable: { findFirst: vi.fn() },
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		const res = await ChatMembershipResolver.creator(
			parent as unknown as CreatorParentParam,
			{},
			ctx as unknown as CreatorCtxParam,
		);
		expect(res).toBeNull();
	});

	test("creator resolver: unexpected when creator user missing (logs)", async () => {
		const parent = {
			id: "m3",
			chatId: "chat-3",
			creatorId: "missing-user",
			memberId: "member-3",
		} as MockParent;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-3" } },
			drizzleClient: {
				query: {
					chatsTable: { findFirst: vi.fn().mockResolvedValue({}) },
					usersTable: { findFirst: vi.fn().mockResolvedValue(undefined) },
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		await expect(
			ChatMembershipResolver.creator(
				parent as unknown as CreatorParentParam,
				{},
				ctx as unknown as CreatorCtxParam,
			),
		).rejects.toMatchObject({ extensions: { code: "unexpected" } });
		expect(ctx.log.error).toHaveBeenCalled();
	});

	test("createChatMembership: arguments_associated_resources_not_found when both missing", async () => {
		const args = {
			input: { chatId: faker.string.uuid(), memberId: faker.string.uuid() },
		} as unknown as MockArgs;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-4" } },
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({ role: "regular" }),
					},
					chatsTable: { findFirst: vi.fn().mockResolvedValue(undefined) },
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		await expect(
			ChatMembershipResolver.createChatMembership(
				undefined,
				args as unknown as CreateArgsParam,
				ctx as unknown as CreateCtxParam,
			),
		).rejects.toMatchObject({
			extensions: {
				code: expect.toBeOneOf([
					"arguments_associated_resources_not_found",
					"invalid_arguments",
				]),
			},
		});
	});

	test("createChatMembership: unauthorized_arguments when non-admin sets role without org membership", async () => {
		const args = {
			input: {
				chatId: faker.string.uuid(),
				memberId: faker.string.uuid(),
				role: "administrator",
			},
		} as unknown as MockArgs;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-5" } },
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({ role: "regular" }),
					},
					chatsTable: {
						findFirst: vi.fn().mockResolvedValue({
							chatMembershipsWhereChat: [],
							organization: { membershipsWhereOrganization: [] },
						}),
					},
					chatMembershipsTable: {
						findFirst: vi.fn().mockResolvedValue(undefined),
					},
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		await expect(
			ChatMembershipResolver.createChatMembership(
				undefined,
				args as unknown as CreateArgsParam,
				ctx as unknown as CreateCtxParam,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthorized_arguments" } });
	});

	test("createChatMembership: unauthorized_action_on_arguments_associated_resources when cannot create membership", async () => {
		const args = {
			input: { chatId: faker.string.uuid(), memberId: faker.string.uuid() },
		} as unknown as MockArgs;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-6" } },
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({ role: "regular" }),
					},
					chatsTable: {
						findFirst: vi.fn().mockResolvedValue({
							chatMembershipsWhereChat: [],
							organization: { membershipsWhereOrganization: [] },
						}),
					},
					chatMembershipsTable: {
						findFirst: vi.fn().mockResolvedValue(undefined),
					},
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		const result = await ChatMembershipResolver.createChatMembership(
			undefined,
			args as unknown as CreateArgsParam,
			ctx as unknown as CreateCtxParam,
		);
		expect(result).toEqual({
			chatMembershipsWhereChat: [],
			organization: { membershipsWhereOrganization: [] },
		});
	});

	test("createChatMembership: forbidden when existing chat membership present", async () => {
		const args = {
			input: { chatId: faker.string.uuid(), memberId: faker.string.uuid() },
		} as unknown as MockArgs;

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: "actor-7" } },
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue({ role: "regular" }),
					},
					chatsTable: {
						findFirst: vi.fn().mockResolvedValue({
							chatMembershipsWhereChat: [{ role: "regular" }],
							organization: { membershipsWhereOrganization: [] },
						}),
					},
					chatMembershipsTable: {
						findFirst: vi.fn().mockResolvedValue(undefined),
					},
				},
			},
			log: { error: vi.fn() },
		} as unknown as MockCtx;

		await expect(
			ChatMembershipResolver.createChatMembership(
				undefined,
				args as unknown as CreateArgsParam,
				ctx as unknown as CreateCtxParam,
			),
		).rejects.toMatchObject({
			extensions: {
				code: "forbidden_action_on_arguments_associated_resources",
			},
		});
	});

	test("unexpected when DB insert returns undefined (simulated defect)", async () => {
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

		const logSpy = vi.spyOn(server.log, "error");
		type InsertChain = {
			values: () => {
				returning: () => Promise<unknown[]>;
			};
		};

		const drizzleClient = server.drizzleClient as unknown as Record<
			string,
			unknown
		>;
		const originalInsert = drizzleClient.insert as unknown;
		(drizzleClient as Record<string, unknown>).insert = (() => ({
			values: () => ({
				returning: async () => [undefined],
			}),
		})) as unknown as ((...args: unknown[]) => InsertChain) | undefined;

		try {
			const res = await mercuriusClient.mutate(Mutation_createChatMembership, {
				headers: { authorization: `bearer ${creatorToken}` },
				variables: { input: { chatId, memberId: target.user?.id } },
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(logSpy).toHaveBeenCalled();
		} finally {
			(drizzleClient as Record<string, unknown>).insert =
				originalInsert as unknown as
					| ((...args: unknown[]) => InsertChain)
					| undefined;
			logSpy.mockRestore();
		}
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

		expect(second.errors).toBeDefined();
		expect(second.errors?.[0]?.extensions?.code).toBe(
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
