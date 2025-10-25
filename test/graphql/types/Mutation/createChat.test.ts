import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteChat,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
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

	const authToken = signInResult.data?.signIn?.authenticationToken;
	assertToBeNonNullish(authToken);
	return authToken;
}

// Helper function to create a test user
async function createTestUser(
	adminAuthToken: string,
	role: "regular" | "administrator" = "regular",
) {
	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: "password123",
				role: role,
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(userResult.data?.createUser);
	return {
		userId: userResult.data.createUser.user?.id as string,
		authToken: userResult.data.createUser.authenticationToken as string,
	};
}

// Helper function to create a test organization
async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Organization ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id;
}

// Helper function to create organization membership
async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					memberId,
					organizationId,
					role,
				},
			},
		},
	);

	assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);
	return membershipResult.data.createOrganizationMembership.id;
}

suite("Mutation field createChat", () => {
	let adminAuthToken: string;
	let regularUserAuthToken: string;
	let regularUserId: string;
	let adminUserId: string;
	let organizationId: string;
	const createdChatIds: string[] = [];
	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];

	beforeAll(async () => {
		adminAuthToken = await getAdminToken();

		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminSignInResult.data?.signIn?.user?.id);
		adminUserId = adminSignInResult.data.signIn.user.id;

		const regularUser = await createTestUser(adminAuthToken, "regular");
		regularUserId = regularUser.userId;
		regularUserAuthToken = regularUser.authToken;
		createdUserIds.push(regularUserId);

		organizationId = await createTestOrganization(adminAuthToken);
		createdOrganizationIds.push(organizationId);

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
	});

	afterAll(async () => {
		for (const chatId of createdChatIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (error) {}
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (error) {}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {}
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createChat" field if client triggering the graphql operation is not authenticated', async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			variables: {
				input: {
					name: "Test Chat",
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createChat" field if provided organization id is not a valid uuid', async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: "Test Chat",
					organizationId: "invalid-uuid",
					type: "group",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message: "Invalid uuid",
							},
						],
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.createChat" field if no organization exists with the provided id', async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: "Test Chat",
					organizationId: faker.string.uuid(),
					type: "group",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test('results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createChat" field if user is not a member of the organization', async () => {
		// Create a new user that's not a member of the organization
		const nonMemberUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(nonMemberUser.userId);

		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${nonMemberUser.authToken}`,
			},
			variables: {
				input: {
					name: "Test Chat",
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test("organization administrator can successfully create a chat", async () => {
		const chatName = `Admin Test Chat ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: chatName,
					description: "Test chat created by admin",
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		expect(result.data?.createChat?.name).toBe(chatName);
		expect(result.data?.createChat?.id).toBeDefined();

		if (result.data?.createChat?.id) {
			createdChatIds.push(result.data.createChat.id);
		}
	});

	test("organization member can successfully create a chat", async () => {
		const chatName = `Member Test Chat ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${regularUserAuthToken}`,
			},
			variables: {
				input: {
					name: chatName,
					description: "Test chat created by regular member",
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		expect(result.data?.createChat?.name).toBe(chatName);
		expect(result.data?.createChat?.id).toBeDefined();

		if (result.data?.createChat?.id) {
			createdChatIds.push(result.data.createChat.id);
		}
	});

	test("can create a chat with minimal required fields", async () => {
		const chatName = `Minimal Chat ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${regularUserAuthToken}`,
			},
			variables: {
				input: {
					name: chatName,
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		expect(result.data?.createChat?.name).toBe(chatName);
		expect(result.data?.createChat?.id).toBeDefined();

		if (result.data?.createChat?.id) {
			createdChatIds.push(result.data.createChat.id);
		}
	});

	test("can create a direct chat by passing participants", async () => {
		const secondUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(secondUser.userId);

		await createOrganizationMembership(
			adminAuthToken,
			secondUser.userId,
			organizationId,
			"regular",
		);

		const chatName = `Direct Chat ${faker.string.uuid()}`;

		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: {
				input: {
					name: chatName,
					participants: [regularUserId, secondUser.userId],
					organizationId: organizationId,
					type: "direct",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		if (!result.data?.createChat?.id) {
			throw new Error("expected chat id");
		}

		createdChatIds.push(result.data.createChat.id);

		// verify in DB that chat is direct and has two regular memberships
		const chat = await server.drizzleClient.query.chatsTable.findFirst({
			where: (f, ops) => ops.eq(f.id, result.data.createChat.id),
		});
		expect(chat).not.toBeUndefined();
		expect(chat?.type).toBe("direct");

		const memberships =
			await server.drizzleClient.query.chatMembershipsTable.findMany({
				where: (fields, ops) =>
					ops.eq(fields.chatId, result.data.createChat.id),
			});
		expect(memberships.length).toBeGreaterThanOrEqual(2);
		expect(
			memberships.filter((m) => m.role === "regular").length,
		).toBeGreaterThanOrEqual(2);
	});

	test("invalid when creating a direct chat with the same user twice", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: {
				input: {
					name: `bad-direct-${faker.string.uuid()}`,
					participants: [regularUserId, regularUserId],
					organizationId: organizationId,
					type: "direct",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("creating the same direct chat twice returns the existing chat and does not duplicate memberships", async () => {
		// create a fresh second user and add to organization
		const secondUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(secondUser.userId);

		await createOrganizationMembership(
			adminAuthToken,
			secondUser.userId,
			organizationId,
			"regular",
		);

		const input = {
			name: `Direct Idempotent ${faker.string.uuid()}`,
			participants: [regularUserId, secondUser.userId],
			organizationId,
			type: "direct" as const,
		};

		const first = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: { input },
		});

		expect(first.errors).toBeUndefined();
		expect(first.data?.createChat).not.toBeNull();
		assertToBeNonNullish(first.data?.createChat?.id);
		createdChatIds.push(first.data.createChat.id);

		const second = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: { input },
		});

		expect(second.errors).toBeUndefined();
		expect(second.data?.createChat).not.toBeNull();
		assertToBeNonNullish(second.data?.createChat?.id);

		const memberships =
			await server.drizzleClient.query.chatMembershipsTable.findMany({
				where: (f, ops) => ops.eq(f.chatId, first.data.createChat.id),
			});
		const memberIds = new Set(memberships.map((m) => m.memberId));
		expect(memberIds.has(regularUserId)).toBe(true);
		expect(memberIds.has(secondUser.userId)).toBe(true);
		// ensure no duplicate rows per member
		for (const id of memberIds) {
			expect(memberships.filter((m) => m.memberId === id).length).toBe(1);
		}
	});

	test("creator is administrator for created group chats", async () => {
		const chatName = `CreatorAdmin ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: {
				input: {
					name: chatName,
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		assertToBeNonNullish(result.data?.createChat?.id);
		createdChatIds.push(result.data.createChat.id);

		const membership =
			await server.drizzleClient.query.chatMembershipsTable.findFirst({
				where: (f, ops) =>
					ops.and(
						ops.eq(f.chatId, result.data.createChat.id),
						ops.eq(f.memberId, regularUserId),
					),
			});

		expect(membership).not.toBeUndefined();
		expect(membership?.role).toBe("administrator");
	});

	test("direct chat requires exactly 2 participants", async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: {
				input: {
					name: `Invalid Direct Chat ${faker.string.uuid()}`,
					participants: [regularUserId], // Only 1 participant
					organizationId: organizationId,
					type: "direct",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "participants"],
								message: "Direct chats must have exactly 2 participants.",
							},
						],
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test("direct chat with 3 participants should fail", async () => {
		const thirdUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(thirdUser.userId);

		await createOrganizationMembership(
			adminAuthToken,
			thirdUser.userId,
			organizationId,
			"regular",
		);

		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${regularUserAuthToken}` },
			variables: {
				input: {
					name: `Invalid Direct Chat ${faker.string.uuid()}`,
					participants: [regularUserId, thirdUser.userId, thirdUser.userId], // 3 participants
					organizationId: organizationId,
					type: "direct",
				},
			},
		});

		expect(result.data?.createChat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "participants"],
								message: "Direct chats must have exactly 2 participants.",
							},
						],
					}),
					message: expect.any(String),
					path: ["createChat"],
				}),
			]),
		);
	});

	test("group chat can be created without participants", async () => {
		const chatName = `Group Chat No Participants ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${regularUserAuthToken}`,
			},
			variables: {
				input: {
					name: chatName,
					organizationId: organizationId,
					type: "group",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		expect(result.data?.createChat?.name).toBe(chatName);
		expect(result.data?.createChat?.id).toBeDefined();

		if (result.data?.createChat?.id) {
			createdChatIds.push(result.data.createChat.id);
		}
	});

	test("group chat can be created with participants", async () => {
		const thirdUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(thirdUser.userId);

		await createOrganizationMembership(
			adminAuthToken,
			thirdUser.userId,
			organizationId,
			"regular",
		);

		const chatName = `Group Chat With Participants ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			headers: {
				authorization: `bearer ${regularUserAuthToken}`,
			},
			variables: {
				input: {
					name: chatName,
					organizationId: organizationId,
					type: "group",
					participants: [thirdUser.userId],
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createChat).not.toBeNull();
		expect(result.data?.createChat?.name).toBe(chatName);
		expect(result.data?.createChat?.id).toBeDefined();

		if (result.data?.createChat?.id) {
			createdChatIds.push(result.data.createChat.id);

			// Verify that both creator and participant are members
			const memberships =
				await server.drizzleClient.query.chatMembershipsTable.findMany({
					where: (fields, ops) =>
						ops.eq(fields.chatId, result.data.createChat.id),
				});

			const memberIds = memberships.map((m) => m.memberId);
			expect(memberIds).toContain(regularUserId);
			expect(memberIds).toContain(thirdUser.userId);

			// Verify creator is admin and participant is regular
			const creatorMembership = memberships.find(
				(m) => m.memberId === regularUserId,
			);
			const participantMembership = memberships.find(
				(m) => m.memberId === thirdUser.userId,
			);

			expect(creatorMembership?.role).toBe("administrator");
			expect(participantMembership?.role).toBe("regular");
		}
	});
});
