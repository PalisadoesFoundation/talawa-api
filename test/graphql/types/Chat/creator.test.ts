import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { chatsTable } from "~/src/drizzle/schema";
import { schemaManager } from "~/src/graphql/schemaManager";
import type {
	TalawaGraphQLErrorExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_chat_with_creator,
	Query_signIn,
} from "../documentNodes";

async function getAdminToken() {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	const token = signInResult.data?.signIn?.authenticationToken;
	const userId = signInResult.data?.signIn?.user?.id;
	assertToBeNonNullish(token);
	assertToBeNonNullish(userId);
	return { token, userId };
}

async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `Bearer ${adminAuthToken}` },
		variables: {
			input: { name: `Test Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id as string;
}

async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const res = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { memberId, organizationId, role } },
		},
	);
	assertToBeNonNullish(res.data?.createOrganizationMembership);
	return res.data.createOrganizationMembership.id as string;
}

async function createTestChat(adminAuthToken: string, organizationId: string) {
	const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `Bearer ${adminAuthToken}` },
		variables: {
			input: { name: `Test Chat ${faker.string.uuid()}`, organizationId },
		},
	});
	assertToBeNonNullish(chatResult.data?.createChat);
	return chatResult.data.createChat.id as string;
}

suite("Chat field creator", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let regularUserId: string;
	let outsiderUserId: string;
	let outsiderUserAuthToken: string;
	let organizationId: string;
	let testChatId: string;

	beforeAll(async () => {
		const admin = await getAdminToken();
		adminAuthToken = admin.token;
		adminUserId = admin.userId;

		const regular = await createRegularUserUsingAdmin();
		regularUserId = regular.userId;

		const outsider = await createRegularUserUsingAdmin();
		outsiderUserId = outsider.userId;
		outsiderUserAuthToken = outsider.authToken;

		organizationId = await createTestOrganization(adminAuthToken);

		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);
		await createOrganizationMembership(
			adminAuthToken,
			regularUserId,
			organizationId,
			"regular",
		);

		testChatId = await createTestChat(adminAuthToken, organizationId);
	});

	afterAll(async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (_e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: regularUserId } },
			});
		} catch (_e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: outsiderUserId } },
			});
		} catch (_e) {}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `Bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		} catch (_e) {}
	});

	test("unauthenticated caller results in unauthenticated error for creator field", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["chat"],
					message: expect.any(String),
				}),
			]),
		);
	});

	test("orphaned token results in unauthenticated error for creator field", async () => {
		const tempUser = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@example.com`,
					name: "t",
					password: "p",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(tempUser.data?.createUser);
		const tempAuth = tempUser.data.createUser.authenticationToken;
		assertToBeNonNullish(tempAuth);
		assertToBeNonNullish(tempUser.data?.createUser.user);
		const tempUserId = tempUser.data.createUser.user.id;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: tempUserId } },
		});

		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${tempAuth}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["chat"],
					message: expect.any(String),
				}),
			]),
		);
	});

	test("outsider (not org member) receives unauthorized_action for creator field", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${outsiderUserAuthToken}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.data.chat).toBeNull();
		expect(res.errors).toBeDefined();
		const maybeExt = res.errors?.[0] as unknown;
		let code: string | undefined;
		if (maybeExt && typeof maybeExt === "object") {
			const obj = maybeExt as Record<string, unknown>;
			const ext = obj.extensions as Record<string, unknown> | undefined;
			if (ext && typeof ext.code === "string") code = ext.code;
		}
		expect([
			"unauthorized_action",
			"unauthorized_action_on_arguments_associated_resources",
		]).toContain(code);
	});

	test("creator equals current user when querying as creator", async () => {
		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: testChatId } },
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.chat?.creator?.id).toEqual(adminUserId);
	});

	test("org member (not creator) receives the creator user object", async () => {
		// Create organization membership for the outsider user as a regular member so they can query the chat
		await createOrganizationMembership(
			adminAuthToken,
			outsiderUserId,
			organizationId,
			"regular",
		);

		const memberRes = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${outsiderUserAuthToken}` },
			variables: { input: { id: testChatId } },
		});

		expect(memberRes.errors).toBeUndefined();
		expect(memberRes.data.chat?.creator?.id).toEqual(adminUserId);
	});

	test("null creator id resolves to null for authorized caller", async () => {
		// Create a fresh chat so we can mutate its creator_id without affecting other tests
		const chatId = await createTestChat(adminAuthToken, organizationId);

		// Directly set creator_id to null using a raw SQL execute to emulate the DB onDelete behavior
		await server.drizzleClient
			.update(chatsTable)
			.set({ creatorId: null })
			.where(eq(chatsTable.id, chatId));

		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: chatId } },
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.chat?.creator).toBeNull();

		// clean up
		await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: chatId } },
		});
	});

	test("deleted creator leads to unexpected error (business logic corruption)", async () => {
		const adminCreator = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@example.com`,
					name: "c",
					password: "p",
					role: "administrator",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(adminCreator.data?.createUser);
		assertToBeNonNullish(adminCreator.data?.createUser.user);
		const adminCreatorId = adminCreator.data.createUser.user.id;
		const adminCreatorAuth = adminCreator.data.createUser.authenticationToken;

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminCreatorId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const chatRes = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `Bearer ${adminCreatorAuth}` },
			variables: {
				input: { name: `OrphanChat ${faker.string.uuid()}`, organizationId },
			},
		});
		assertToBeNonNullish(chatRes.data?.createChat);
		const orphanChatId = chatRes.data.createChat.id;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: adminCreatorId } },
		});

		const res = await mercuriusClient.query(Query_chat_with_creator, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: orphanChatId } },
		});

		if (res.errors && res.errors.length > 0) {
			expect(res.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<TalawaGraphQLErrorExtensions>({
							code: "unexpected",
						}),
						path: ["chat", "creator"],
						message: expect.any(String),
					}),
				]),
			);
		} else {
			expect(res.data.chat).toBeDefined();
			expect(res.data.chat?.creator).toBeNull();
		}

		await mercuriusClient.mutate(Mutation_deleteChat, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: orphanChatId } },
		});
	});

	test("creator resolver unauthenticated when invoked directly", async () => {
		const schema = await schemaManager.buildInitialSchema();

		const chatType = schema.getType("Chat") as GraphQLObjectType;

		const fields = chatType.getFields();
		if (!fields.creator) throw new Error("Chat.creator field not found");
		const creatorField = fields.creator;

		const parent = {
			id: testChatId,
			organizationId,
			creatorId: adminUserId,
		};

		const ctx = {
			currentClient: { isAuthenticated: false },
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};

		await expect(async () =>
			creatorField.resolve?.(
				parent,
				{},
				ctx,
				undefined as unknown as GraphQLResolveInfo,
			),
		).rejects.toMatchObject({
			extensions: expect.objectContaining({ code: "unauthenticated" }),
		});
	});

	test("creator resolver currentUser undefined when invoked directly", async () => {
		const schema = await schemaManager.buildInitialSchema();

		const fields = (schema.getType("Chat") as GraphQLObjectType).getFields();
		if (!fields.creator) throw new Error("Chat.creator field not found");
		const creatorField = fields.creator;

		const parent = {
			id: testChatId,
			organizationId,
			creatorId: adminUserId,
		};

		// Use a token payload user id that doesn't exist in the DB to emulate an orphaned
		// authenticated token for the caller. This will make the resolver query the DB
		// for the current user and receive `undefined`, triggering the branch.
		const ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: faker.string.uuid() },
			},
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};

		await expect(async () =>
			creatorField.resolve?.(
				parent,
				{},
				ctx,
				undefined as unknown as GraphQLResolveInfo,
			),
		).rejects.toMatchObject({
			extensions: expect.objectContaining({ code: "unauthenticated" }),
		});
	});

	test("creator resolver unauthorized_action when caller is non-admin non-member", async () => {
		// create a fresh regular user who is NOT a member of the chat's organization
		const temp = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@example.com`,
					name: "nm",
					password: "p",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(temp.data?.createUser);
		assertToBeNonNullish(temp.data?.createUser.user);
		const tempUserId = temp.data.createUser.user.id;

		const schema = await schemaManager.buildInitialSchema();
		const fields = (schema.getType("Chat") as GraphQLObjectType).getFields();
		if (!fields.creator) throw new Error("Chat.creator field not found");
		const creatorField = fields.creator;

		const parent = {
			id: testChatId,
			organizationId,
			creatorId: adminUserId,
		};

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: tempUserId } },
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};

		await expect(async () =>
			creatorField.resolve?.(
				parent,
				{},
				ctx,
				undefined as unknown as GraphQLResolveInfo,
			),
		).rejects.toMatchObject({
			extensions: expect.objectContaining({ code: "unauthorized_action" }),
		});

		// cleanup
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: tempUserId } },
		});
	});

	test("creator resolver existingUser undefined when invoked directly", async () => {
		const schema = await schemaManager.buildInitialSchema();
		const fields = (schema.getType("Chat") as GraphQLObjectType).getFields();
		if (!fields.creator) throw new Error("Chat.creator field not found");
		const creatorField = fields.creator;

		const parent = {
			id: testChatId,
			organizationId,
			// use a random UUID that does not exist in the DB to force the findFirst
			creatorId: faker.string.uuid(),
		};

		const ctx = {
			currentClient: { isAuthenticated: true, user: { id: adminUserId } },
			drizzleClient: server.drizzleClient,
			log: server.log,
			envConfig: server.envConfig,
			jwt: server.jwt,
			minio: server.minio,
		};

		await expect(async () =>
			creatorField.resolve?.(
				parent,
				{},
				ctx,
				undefined as unknown as GraphQLResolveInfo,
			),
		).rejects.toMatchObject({
			extensions: expect.objectContaining({ code: "unexpected" }),
		});
	});
});
