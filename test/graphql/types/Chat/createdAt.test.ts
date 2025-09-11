import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
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

// Custom GraphQL query for testing createdAt field access
const Query_chat_with_createdAt = `
	query Query_chat_with_createdAt($input: QueryChatInput!) {
		chat(input: $input) {
			id
			name
			createdAt
		}
	}
`;

// Helper function to get admin auth token
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
	isEmailAddressVerified = false,
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
				isEmailAddressVerified: isEmailAddressVerified,
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

// Helper function to create a test chat
async function createTestChat(adminAuthToken: string, organizationId: string) {
	const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Chat ${faker.string.uuid()}`,
				organizationId,
			},
		},
	});

	assertToBeNonNullish(chatResult.data?.createChat);
	return chatResult.data.createChat.id;
}

// Helper function to add user to chat
async function addUserToChat(
	adminAuthToken: string,
	chatId: string,
	memberId: string,
) {
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createChatMembership,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					chatId,
					memberId,
				},
			},
		},
	);

	assertToBeNonNullish(membershipResult.data?.createChatMembership);
	return membershipResult.data.createChatMembership.id;
}

suite("Chat field createdAt", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let regularUser1AuthToken: string;
	let regularUser1Id: string;
	let regularUser2AuthToken: string;
	let regularUser2Id: string;
	let organizationId: string;
	let testChatId: string;
	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];

	beforeAll(async () => {
		// Get admin token and user ID
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

		// Create test users
		const user1 = await createTestUser(adminAuthToken, "regular");
		regularUser1Id = user1.userId;
		regularUser1AuthToken = user1.authToken;
		createdUserIds.push(regularUser1Id);

		const user2 = await createTestUser(adminAuthToken, "regular");
		regularUser2Id = user2.userId;
		regularUser2AuthToken = user2.authToken;
		createdUserIds.push(regularUser2Id);

		// Create test organization
		organizationId = await createTestOrganization(adminAuthToken);
		createdOrganizationIds.push(organizationId);

		// Add admin to organization
		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);

		// Add users to organization
		await createOrganizationMembership(
			adminAuthToken,
			regularUser1Id,
			organizationId,
			"regular",
		);

		await createOrganizationMembership(
			adminAuthToken,
			regularUser2Id,
			organizationId,
			"regular",
		);

		// Create test chat
		testChatId = await createTestChat(adminAuthToken, organizationId);

		// Add user1 to chat
		await addUserToChat(adminAuthToken, testChatId, regularUser1Id);
	});

	afterAll(async () => {
		// Cleanup: Delete test data
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (error) {
			// Ignore cleanup errors
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (error) {
				// Ignore cleanup errors
			}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				// Ignore cleanup errors
			}
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code when client is not authenticated', async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.data?.chat).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["chat"], // Error is at chat level, not createdAt level
				}),
			]),
		);
	});

	test('results in a graphql error with "unauthorized_action" extensions code when user is not a chat member and not an administrator', async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: {
				authorization: `bearer ${regularUser2AuthToken}`,
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.data?.chat?.createdAt).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["chat", "createdAt"],
				}),
			]),
		);
	});

	test("allows chat member to access createdAt field", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: {
				authorization: `bearer ${regularUser1AuthToken}`,
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chat).not.toBeNull();
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
		expect(typeof result.data?.chat?.createdAt).toBe("string");
	});

	test("allows administrator to access createdAt field", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chat).not.toBeNull();
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
		expect(typeof result.data?.chat?.createdAt).toBe("string");
	});

	test("allows chat creator to access createdAt field", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: {
				authorization: `bearer ${adminAuthToken}`, // admin created the chat
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chat).not.toBeNull();
		expect(result.data?.chat?.id).toBe(testChatId);
		expect(result.data?.chat?.createdAt).toBeDefined();
		expect(typeof result.data?.chat?.createdAt).toBe("string");
	});

	test("returns valid ISO 8601 timestamp for createdAt field", async () => {
		const result = await mercuriusClient.query(Query_chat_with_createdAt, {
			headers: {
				authorization: `bearer ${regularUser1AuthToken}`,
			},
			variables: {
				input: {
					id: testChatId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.chat?.createdAt).toBeDefined();

		// Verify it's a valid ISO 8601 timestamp
		const createdAt = new Date(result.data?.chat?.createdAt);
		expect(createdAt).toBeInstanceOf(Date);
		expect(createdAt.getTime()).not.toBeNaN();

		// Verify it's from the past (created before now)
		expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
	});
});
