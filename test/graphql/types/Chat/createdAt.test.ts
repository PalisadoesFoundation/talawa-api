import { faker } from "@faker-js/faker";
import type { TadaDocumentNode } from "gql.tada";
import { afterEach, beforeEach, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
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

/**
 * COVERAGE NOTE:
 *
 * This test file achieves high coverage of src/graphql/types/Chat/createdAt.ts.
 * Integration tests cover the main execution paths.
 *
 * The defensive auth guards (lines checking ctx.currentClient.isAuthenticated
 * and user existence) are unreachable in normal integration test flow since
 * src/graphql/types/Query/chat.ts validates them first. These represent
 * defense-in-depth programming and would only execute in edge cases like
 * direct resolver invocation or if the parent resolver is bypassed.
 */

// Types
interface User {
	userId: string;
	authToken: string;
}

interface SetupEnv {
	adminAuthToken: string;
	organizationId: string;
	testChatId: string;
	users: [User, User];
}

type AdminCreds = { authToken: string; userId: string };

// GraphQL Query
const Query_chat_with_createdAt = `
	query Query_chat_with_createdAt($input: QueryChatInput!) {
		chat(input: $input) {
			id
			name
			createdAt
		}
	}
`;

// Helpers
async function getAdminCreds(): Promise<AdminCreds> {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	expect(result.errors ?? []).toHaveLength(0);
	const authToken = result.data?.signIn?.authenticationToken;
	const userId = result.data?.signIn?.user?.id;
	assertToBeNonNullish(authToken);
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createTestUser(
	adminAuthToken: string,
	role: "regular" | "administrator" = "regular",
	isEmailAddressVerified = false,
): Promise<User> {
	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: "password123",
				role,
				isEmailAddressVerified,
			},
		},
	});
	expect(userResult.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(userResult.data?.createUser);
	return {
		userId: userResult.data.createUser.user?.id as string,
		authToken: userResult.data.createUser.authenticationToken as string,
	};
}

async function createTestOrganization(adminAuthToken: string): Promise<string> {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: { name: `Test Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	expect(orgResult.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id;
}

async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
): Promise<string> {
	const result = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { memberId, organizationId, role } },
		},
	);
	expect(result.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(result.data?.createOrganizationMembership);
	return result.data.createOrganizationMembership.id;
}

async function createTestChat(
	authToken: string,
	organizationId: string,
): Promise<string> {
	const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: { name: `Test Chat ${faker.string.uuid()}`, organizationId },
		},
	});
	expect(chatResult.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(chatResult.data?.createChat);
	return chatResult.data.createChat.id;
}

async function addUserToChat(
	adminAuthToken: string,
	chatId: string,
	memberId: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: { input: { chatId, memberId } },
	});
	expect(result.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(result.data?.createChatMembership);
	return result.data.createChatMembership.id;
}

/**
 * Ensures a user is a member of a chat, handling the case where they may already be a member.
 * If the user is already a member, this is a no-op (returns undefined).
 * Otherwise, creates the membership and returns the membership ID.
 */
async function ensureUserIsChatMember(
	adminAuthToken: string,
	chatId: string,
	memberId: string,
): Promise<string | undefined> {
	const result = await mercuriusClient.mutate(Mutation_createChatMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: { input: { chatId, memberId } },
	});

	// Check if the error is "already a member"
	const alreadyMemberError = result.errors?.find(
		(err) =>
			err.extensions?.code ===
			"forbidden_action_on_arguments_associated_resources",
	);

	if (alreadyMemberError) {
		// User is already a member, treat as success
		return undefined;
	}

	// If there are other errors, fail the test
	expect(result.errors ?? []).toHaveLength(0);
	assertToBeNonNullish(result.data?.createChatMembership);
	return result.data.createChatMembership.id;
}

// Setup / Teardown
async function setupTestEnvironment(): Promise<SetupEnv> {
	const { authToken: adminAuthToken, userId: adminUserId } =
		await getAdminCreds();

	const [user1, user2] = await Promise.all([
		createTestUser(adminAuthToken),
		createTestUser(adminAuthToken),
	]);
	const organizationId = await createTestOrganization(adminAuthToken);

	await Promise.all([
		createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		),
		createOrganizationMembership(adminAuthToken, user1.userId, organizationId),
		createOrganizationMembership(adminAuthToken, user2.userId, organizationId),
	]);

	const testChatId = await createTestChat(adminAuthToken, organizationId);
	await addUserToChat(adminAuthToken, testChatId, user1.userId);

	return {
		adminAuthToken,
		organizationId,
		testChatId,
		users: [user1, user2],
	};
}

async function cleanupTestData(
	adminAuthToken: string,
	userIds: string[],
	organizationIds: string[],
	chatIds: string[],
) {
	const headers = { authorization: `bearer ${adminAuthToken}` };
	const del = (ids: string[], mutation: TadaDocumentNode) =>
		Promise.all(
			ids.map((id) =>
				mercuriusClient
					.mutate(mutation, { headers, variables: { input: { id } } })
					.catch((err: unknown) => {
						if (process.env.VITEST_DEBUG) {
							// Log only when debugging to avoid noisy CI output
							// eslint-disable-next-line no-console
							console.debug("Cleanup error:", err);
						}
					}),
			),
		);
	// Stage by FK dependency to reduce transient errors
	await del(chatIds, Mutation_deleteChat);
	await del(userIds, Mutation_deleteUser);
	await del(organizationIds, Mutation_deleteOrganization);
}

// Test Suite
suite("Chat field createdAt", () => {
	let adminAuthToken: string;
	let regularUser1AuthToken: string;
	let regularUser1UserId: string;
	let regularUser2AuthToken: string;
	let organizationId: string;
	let testChatId: string;

	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];
	const createdChatIds: string[] = [];

	beforeEach(async () => {
		const setup = await setupTestEnvironment();
		adminAuthToken = setup.adminAuthToken;
		organizationId = setup.organizationId;
		testChatId = setup.testChatId;

		regularUser1AuthToken = setup.users[0].authToken;
		regularUser1UserId = setup.users[0].userId;
		regularUser2AuthToken = setup.users[1].authToken;

		createdUserIds.push(setup.users[0].userId, setup.users[1].userId);
		createdOrganizationIds.push(organizationId);
		createdChatIds.push(testChatId);
	});

	afterEach(async () => {
		await cleanupTestData(
			adminAuthToken,
			createdUserIds,
			createdOrganizationIds,
			createdChatIds,
		);
		// Reset arrays for next test
		createdUserIds.length = 0;
		createdOrganizationIds.length = 0;
		createdChatIds.length = 0;
	});

	test("unauthenticated client → graphql unauthenticated error", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			variables: { input: { id: testChatId } },
		});
		expect(result.data?.chat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<Partial<TalawaGraphQLFormattedError>>([
				expect.objectContaining<Partial<TalawaGraphQLFormattedError>>({
					message: expect.any(String),
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["chat"],
				}),
			]),
		);
	});

	test("non-member regular user → unauthorized_action error", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${regularUser2AuthToken}` },
			variables: { input: { id: testChatId } },
		});
		expect(result.data?.chat).not.toBeNull();
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<Partial<TalawaGraphQLFormattedError>>([
				expect.objectContaining<Partial<TalawaGraphQLFormattedError>>({
					message: expect.any(String),
					extensions: expect.objectContaining({ code: "unauthorized_action" }),
					path: ["chat", "createdAt"],
				}),
			]),
		);
	});

	test("chat member can access createdAt", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${regularUser1AuthToken}` },
			variables: { input: { id: testChatId } },
		});
		expect(result.errors ?? []).toHaveLength(0);
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
	});

	test("admin can access createdAt", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: testChatId } },
		});
		expect(result.errors ?? []).toHaveLength(0);
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
	});

	test("allows non-admin chat creator to access createdAt", async () => {
		const creatorChatId = await createTestChat(
			regularUser1AuthToken,
			organizationId,
		);
		createdChatIds.push(creatorChatId);

		// Ensure the creator is a member (no-op if already added automatically)
		await ensureUserIsChatMember(
			adminAuthToken,
			creatorChatId,
			regularUser1UserId,
		);

		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${regularUser1AuthToken}` },
			variables: { input: { id: creatorChatId } },
		});
		expect(result.errors ?? []).toHaveLength(0);
		expect(result.data?.chat?.id).toBe(creatorChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
	});

	test("deleted user token → unauthenticated error", async () => {
		const tempUser = await createTestUser(adminAuthToken);
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: tempUser.userId } },
		});
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${tempUser.authToken}` },
			variables: { input: { id: testChatId } },
		});
		expect(result.data?.chat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<Partial<TalawaGraphQLFormattedError>>([
				expect.objectContaining<Partial<TalawaGraphQLFormattedError>>({
					message: expect.any(String),
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["chat"],
				}),
			]),
		);
	});

	test("createdAt field returns valid ISO 8601 timestamp", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: { authorization: `bearer ${regularUser1AuthToken}` },
			variables: { input: { id: testChatId } },
		});
		expect(result.errors ?? []).toHaveLength(0);
		expect(result.data?.chat?.createdAt).toBeDefined();

		const createdAtString = result.data?.chat?.createdAt as string;

		// Assert ISO‑8601 UTC; allow optional fractional seconds (1–3 digits)
		const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
		expect(createdAtString).toMatch(iso8601Regex);

		// Ensure the string is the canonical ISO serialization
		const createdAt = new Date(createdAtString);
		expect(createdAt).toBeInstanceOf(Date);
		expect(createdAt.getTime()).not.toBeNaN();
		expect(createdAt.toISOString()).toBe(createdAtString);
		expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
	});
});
