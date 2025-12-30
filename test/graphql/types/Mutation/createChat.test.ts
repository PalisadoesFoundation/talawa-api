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
		// Get admin token
		adminAuthToken = await getAdminToken();

		// Get admin user ID
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

		// Create a test user
		const regularUser = await createTestUser(adminAuthToken, "regular");
		regularUserId = regularUser.userId;
		regularUserAuthToken = regularUser.authToken;
		createdUserIds.push(regularUserId);

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

		// Add regular user to organization
		await createOrganizationMembership(
			adminAuthToken,
			regularUserId,
			organizationId,
			"regular",
		);
	});

	afterAll(async () => {
		// Cleanup: Delete test data
		for (const chatId of createdChatIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteChat, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: chatId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createChat" field if client triggering the graphql operation is not authenticated', async () => {
		const result = await mercuriusClient.mutate(Mutation_createChat, {
			variables: {
				input: {
					name: "Test Chat",
					organizationId: organizationId,
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
});
