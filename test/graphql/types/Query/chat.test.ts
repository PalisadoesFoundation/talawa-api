import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
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
	Query_chat,
	Query_chatsByUser,
	Query_signIn,
} from "../documentNodes";

suite("Query field chat", () => {
	let adminAuthToken: string;
	let regularUser1Id: string;
	let regularUser1AuthToken: string;
	let regularUser2Id: string;
	let regularUser2AuthToken: string;
	let organizationId: string;
	let testChatId: string;

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
	async function createTestUser(role: "regular" | "administrator" = "regular") {
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
	async function createTestOrganization() {
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: `Test Organization ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		return orgResult.data.createOrganization.id;
	}

	// Helper function to create organization membership
	async function createOrganizationMembership(
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
	async function createTestChat(organizationId: string) {
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
	async function addUserToChat(chatId: string, memberId: string) {
		const chatMembershipResult = await mercuriusClient.mutate(
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

		assertToBeNonNullish(chatMembershipResult.data?.createChatMembership);
		return chatMembershipResult.data.createChatMembership.id;
	}

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

		// Create test users
		const user1 = await createTestUser("regular");
		regularUser1Id = user1.userId;
		regularUser1AuthToken = user1.authToken;

		const user2 = await createTestUser("regular");
		regularUser2Id = user2.userId;
		regularUser2AuthToken = user2.authToken;

		// Create test organization
		organizationId = await createTestOrganization();

		// Add user1 to organization
		await createOrganizationMembership(
			regularUser1Id,
			organizationId,
			"regular",
		);

		// Create test chat
		testChatId = await createTestChat(organizationId);

		// Add user1 to chat
		await addUserToChat(testChatId, regularUser1Id);
	});

	afterAll(async () => {
		// Cleanup: Delete test data
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUser1Id } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUser2Id } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.chat" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated", async () => {
				const chatResult = await mercuriusClient.query(Query_chat, {
					variables: {
						input: {
							id: testChatId,
						},
					},
				});

				expect(chatResult.data.chat).toBeNull();
				expect(chatResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["chat"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context", async () => {
				// Create and delete a user to get an orphaned token
				const tempUser = await createTestUser("regular");
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tempUser.userId } },
				});

				const chatResult = await mercuriusClient.query(Query_chat, {
					headers: {
						authorization: `bearer ${tempUser.authToken}`,
					},
					variables: {
						input: {
							id: testChatId,
						},
					},
				});

				expect(chatResult.data.chat).toBeNull();
				expect(chatResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["chat"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.chat" field if`,
		() => {
			test("provided chat id is not a valid uuid", async () => {
				const chatResult = await mercuriusClient.query(Query_chat, {
					headers: {
						authorization: `bearer ${regularUser1AuthToken}`,
					},
					variables: {
						input: {
							id: "invalid-uuid",
						},
					},
				});

				expect(chatResult.data.chat).toBeNull();
				expect(chatResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: expect.any(String),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["chat"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.chat" field if`,
		() => {
			test("no chat exists with the provided id", async () => {
				const nonExistentChatId = faker.string.uuid();

				const chatResult = await mercuriusClient.query(Query_chat, {
					headers: {
						authorization: `bearer ${regularUser1AuthToken}`,
					},
					variables: {
						input: {
							id: nonExistentChatId,
						},
					},
				});

				expect(chatResult.data.chat).toBeNull();
				expect(chatResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["chat"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.chat" field if`,
		() => {
			test("regular user attempts to access a chat from an organization they are not a member of", async () => {
				const chatResult = await mercuriusClient.query(Query_chat, {
					headers: {
						authorization: `bearer ${regularUser2AuthToken}`,
					},
					variables: {
						input: {
							id: testChatId,
						},
					},
				});

				expect(chatResult.data.chat).toBeNull();
				expect(chatResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["chat"],
						}),
					]),
				);
			});
		},
	);

	suite("successful chat access", () => {
		test("organization member can access chat", async () => {
			const chatResult = await mercuriusClient.query(Query_chat, {
				headers: {
					authorization: `bearer ${regularUser1AuthToken}`,
				},
				variables: {
					input: {
						id: testChatId,
					},
				},
			});

			expect(chatResult.errors).toBeUndefined();
			expect(chatResult.data.chat).toEqual(
				expect.objectContaining({
					id: testChatId,
				}),
			);
		});

		test("administrator can access any chat", async () => {
			const chatResult = await mercuriusClient.query(Query_chat, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: testChatId,
					},
				},
			});

			expect(chatResult.errors).toBeUndefined();
			expect(chatResult.data.chat).toEqual(
				expect.objectContaining({
					id: testChatId,
				}),
			);
		});
	});
});

suite("Query field chatsByUser", () => {
	let adminAuthToken: string;
	let regularUser1Id: string;
	let regularUser1AuthToken: string;
	let regularUser2Id: string;
	let regularUser2AuthToken: string;
	let organizationId: string;
	let testChatId: string;

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

		// Create test users

		const user1 = await createTestUser("regular");
		regularUser1Id = user1.userId;
		regularUser1AuthToken = user1.authToken;

		const user2 = await createTestUser("regular");
		regularUser2Id = user2.userId;
		regularUser2AuthToken = user2.authToken;

		// Create test organization
		organizationId = await createTestOrganization();

		// Add user1 to organization
		await createOrganizationMembership(
			regularUser1Id,
			organizationId,
			"regular",
		);

		// Create test chat
		testChatId = await createTestChat(organizationId);

		// Add user1 to chat
		await addUserToChat(testChatId, regularUser1Id);
	});

	// Helper functions (reuse from above)
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

	async function createTestUser(role: "regular" | "administrator" = "regular") {
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

	async function createTestOrganization() {
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: `Test Organization ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		return orgResult.data.createOrganization.id;
	}

	async function createOrganizationMembership(
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

	async function createTestChat(organizationId: string) {
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

	async function addUserToChat(chatId: string, memberId: string) {
		const chatMembershipResult = await mercuriusClient.mutate(
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

		assertToBeNonNullish(chatMembershipResult.data?.createChatMembership);
		return chatMembershipResult.data.createChatMembership.id;
	}

	afterAll(async () => {
		// Cleanup: Delete test data
		try {
			await mercuriusClient.mutate(Mutation_deleteChat, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: testChatId } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUser1Id } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUser2Id } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deleted
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		} catch (error) {
			// Ignore cleanup errors as resources may already be deletedx
		}
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.chatsByUser" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated", async () => {
				const chatsByUserResult = await mercuriusClient.query(
					Query_chatsByUser,
					{
						variables: {
							input: {
								id: regularUser1Id,
							},
						},
					},
				);

				expect(chatsByUserResult.data.chatsByUser).toBeNull();
				expect(chatsByUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["chatsByUser"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context", async () => {
				// Create and delete a user to get an orphaned token
				const tempUser = await createTestUser("regular");
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tempUser.userId } },
				});

				const chatsByUserResult = await mercuriusClient.query(
					Query_chatsByUser,
					{
						headers: {
							authorization: `bearer ${tempUser.authToken}`,
						},
						variables: {
							input: {
								id: regularUser1Id,
							},
						},
					},
				);

				expect(chatsByUserResult.data.chatsByUser).toBeNull();
				expect(chatsByUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["chatsByUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.chatsByUser" field if`,
		() => {
			test("provided user id is not a valid uuid", async () => {
				const chatsByUserResult = await mercuriusClient.query(
					Query_chatsByUser,
					{
						headers: {
							authorization: `bearer ${regularUser1AuthToken}`,
						},
						variables: {
							input: {
								id: "invalid-uuid",
							},
						},
					},
				);

				expect(chatsByUserResult.data.chatsByUser).toBeNull();
				expect(chatsByUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: expect.any(String),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["chatsByUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.chatsByUser" field if`,
		() => {
			test("no user exists with the provided id", async () => {
				const nonExistentUserId = faker.string.uuid();

				const chatsByUserResult = await mercuriusClient.query(
					Query_chatsByUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: nonExistentUserId,
							},
						},
					},
				);

				expect(chatsByUserResult.data.chatsByUser).toBeNull();
				expect(chatsByUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["chatsByUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.chatsByUser" field if`,
		() => {
			test("regular user attempts to access chats of another user", async () => {
				const chatsByUserResult = await mercuriusClient.query(
					Query_chatsByUser,
					{
						headers: {
							authorization: `bearer ${regularUser1AuthToken}`,
						},
						variables: {
							input: {
								id: regularUser2Id,
							},
						},
					},
				);

				expect(chatsByUserResult.data.chatsByUser).toBeNull();
				expect(chatsByUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["chatsByUser"],
						}),
					]),
				);
			});
		},
	);

	suite("successful chatsByUser access", () => {
		test("user can access their own chats", async () => {
			const chatsByUserResult = await mercuriusClient.query(Query_chatsByUser, {
				headers: {
					authorization: `bearer ${regularUser1AuthToken}`,
				},
				variables: {
					input: {
						id: regularUser1Id,
					},
				},
			});

			expect(chatsByUserResult.errors).toBeUndefined();
			expect(Array.isArray(chatsByUserResult.data.chatsByUser)).toBe(true);
			expect(chatsByUserResult.data.chatsByUser).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: testChatId,
					}),
				]),
			);
		});

		test("administrator can access any user's chats", async () => {
			const chatsByUserResult = await mercuriusClient.query(Query_chatsByUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: regularUser1Id,
					},
				},
			});

			expect(chatsByUserResult.errors).toBeUndefined();
			expect(Array.isArray(chatsByUserResult.data.chatsByUser)).toBe(true);
			expect(chatsByUserResult.data.chatsByUser).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: testChatId,
					}),
				]),
			);
		});

		test("returns empty array when user has no chats", async () => {
			const chatsByUserResult = await mercuriusClient.query(Query_chatsByUser, {
				headers: {
					authorization: `bearer ${regularUser2AuthToken}`,
				},
				variables: {
					input: {
						id: regularUser2Id,
					},
				},
			});

			expect(chatsByUserResult.errors).toBeUndefined();
			expect(Array.isArray(chatsByUserResult.data.chatsByUser)).toBe(true);
			expect(chatsByUserResult.data.chatsByUser).toHaveLength(0);
		});
	});
});
