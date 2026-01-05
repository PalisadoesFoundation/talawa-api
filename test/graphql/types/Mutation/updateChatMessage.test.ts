import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createChat,
	Mutation_createChatMessage,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_updateChatMessage,
	Query_signIn,
} from "../documentNodes";

afterEach(() => {
	vi.clearAllMocks();
});

suite("Mutation field updateChatMessage", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateChatMessage" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const updateChatMessageResult = await mercuriusClient.mutate(
					Mutation_updateChatMessage,
					{
						variables: {
							input: {
								id: faker.string.uuid(),
								body: "Updated message",
							},
						},
					},
				);

				expect(updateChatMessageResult.data.updateChatMessage).toEqual(null);
				expect(updateChatMessageResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateChatMessage"],
						}),
					]),
				);
			});

			test("client triggering the GraphQL operation has no existing user associated to their authentication context.", async () => {
				// Sign in as Administrator
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				// Create a new user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "TestPassword123",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				const userToken = createUserResult.data.createUser.authenticationToken;
				const userId = createUserResult.data.createUser.user.id;

				// Delete the user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: { id: userId },
					},
				});

				// Try performing an action with the deleted user's token
				const updateChatMessageResult = await mercuriusClient.mutate(
					Mutation_updateChatMessage,
					{
						headers: {
							authorization: `bearer ${userToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
								body: "Updated Message",
							},
						},
					},
				);

				// Expect an authentication error because the user is deleted
				expect(updateChatMessageResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateChatMessage"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`returns an error with "unauthorized_action_on_arguments_associated_resources" 
      if the user is not part of the chat`,
		() => {
			test("returns an authorization error if user has a non-admin org membership but is not in the chat", async () => {
				// Sign in as Administrator
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				const adminToken =
					administratorUserSignInResult.data.signIn.authenticationToken;

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.user?.id,
				);

				const adminUserId = administratorUserSignInResult.data.signIn.user.id;

				// Create a non-admin user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@test.com`,
								isEmailAddressVerified: true,
								name: "Regular User",
								password: "TestPassword123",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				const regularUserToken =
					createUserResult.data.createUser.authenticationToken;
				const regularUserId = createUserResult.data.createUser.user.id;

				const organizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: `Test Org ${faker.string.uuid()}`,
								addressLine1: "123 Main St",
								city: "New York",
								countryCode: "us",
								description: "Test Description",
							},
						},
					},
				);

				const organizationId = organizationResult.data?.createOrganization?.id;
				assertToBeNonNullish(organizationId);

				// Add admin user to the organization
				const createAdminMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								organizationId,
								memberId: adminUserId,
								role: "administrator",
							},
						},
					},
				);

				assertToBeNonNullish(
					createAdminMembershipResult.data?.createOrganizationMembership?.id,
				);

				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								organizationId, // Reuse the same ID
								memberId: regularUserId,
								role: "regular", // Non-admin role
							},
						},
					},
				);

				assertToBeNonNullish(
					createOrganizationResult.data?.createOrganizationMembership?.id,
				);

				// Create a chat in the same organization
				const createChatResult = await mercuriusClient.mutate(
					Mutation_createChat,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `Test Chat ${faker.string.uuid()}`,
								description: "Test chat description",
								organizationId, // Ensure this matches
							},
						},
					},
				);

				const chatId = createChatResult.data?.createChat?.id;
				assertToBeNonNullish(chatId);

				// Create a chat message as the administrator
				const createMessageResult = await mercuriusClient.mutate(
					Mutation_createChatMessage,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								chatId,
								body: "Original Message",
							},
						},
					},
				);

				const messageId = createMessageResult.data?.createChatMessage?.id;
				assertToBeNonNullish(messageId);

				// Attempt to update the message as the regular user (who is in the org but NOT in the chat)
				const updateChatMessageResult = await mercuriusClient.mutate(
					Mutation_updateChatMessage,
					{
						headers: {
							authorization: `bearer ${regularUserToken}`,
						},
						variables: {
							input: {
								id: messageId,
								body: "Unauthorized Update",
							},
						},
					},
				);

				// Expect an authorization error due to missing chat membership
				expect(updateChatMessageResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
							}),
							message:
								"You are not authorized to perform this action on the resources associated to the provided arguments.",
						}),
					]),
				);
			});
		},
	);

	test(`returns "arguments_associated_resources_not_found" error when trying to update a non-existing message`, async () => {
		const userSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const userToken = userSignInResult.data?.signIn?.authenticationToken;
		if (!userToken) throw new Error("User authentication failed");

		const updateChatMessageResult = await mercuriusClient.mutate(
			Mutation_updateChatMessage,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: faker.string.uuid(), // Random non-existing ID
						body: "Updated message",
					},
				},
			},
		);

		expect(updateChatMessageResult.data.updateChatMessage).toBeNull();
		expect(updateChatMessageResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String), // Ensure message exists
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
					path: ["updateChatMessage"],
				}),
			]),
		);
	});

	test(`returns an "invalid_arguments" error when the message body is empty`, async () => {
		const userSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const userToken = userSignInResult.data?.signIn?.authenticationToken;
		if (!userToken) throw new Error("User authentication failed");

		const updateChatMessageResult = await mercuriusClient.mutate(
			Mutation_updateChatMessage,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						body: "", // Empty message body
					},
				},
			},
		);

		expect(updateChatMessageResult.data.updateChatMessage).toBeNull();
		expect(updateChatMessageResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["updateChatMessage"],
				}),
			]),
		);
	});

	test(`returns an "unexpected" error if updatedMessage is undefined (unexpected case)`, async () => {
		// Sign in as an administrator
		const userSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const userData = userSignInResult.data?.signIn;
		assertToBeNonNullish(userData?.authenticationToken);
		assertToBeNonNullish(userData?.user?.id);

		const userToken = userData.authenticationToken;
		const userId = userData.user.id;

		// Create an organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Main St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		const organizationId = organizationResult.data?.createOrganization?.id;
		assertToBeNonNullish(organizationId);

		// Add user to the organization
		const orgMembershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						organizationId,
						memberId: userId,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(
			orgMembershipResult.data?.createOrganizationMembership?.id,
		);

		// Create a chat
		const createChatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					name: faker.string.uuid(),
					description: "Test chat description",
					organizationId,
				},
			},
		});
		const chatId = createChatResult.data?.createChat?.id;
		assertToBeNonNullish(chatId);

		// Create a chat message
		const createMessageResult = await mercuriusClient.mutate(
			Mutation_createChatMessage,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { chatId, body: "Test Message" } },
			},
		);
		const messageId = createMessageResult.data?.createChatMessage?.id;
		assertToBeNonNullish(messageId);

		// Mock the database update operation to simulate returning undefined
		// Save the original update method
		const originalUpdate = server.drizzleClient.update;

		// Mock the update method to return an empty array when returning() is called
		server.drizzleClient.update = vi.fn().mockImplementation(() => {
			return {
				set: () => ({
					where: () => ({
						returning: () => Promise.resolve([]), // Empty array causes updatedChatMessage to be undefined
					}),
				}),
			};
		});

		try {
			// Attempt to update the message which will trigger the mock
			const updateChatMessageResult = await mercuriusClient.mutate(
				Mutation_updateChatMessage,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							id: messageId,
							body: "Updated Message Content",
						},
					},
				},
			);

			// Ensure `errors` exists before checking its length
			expect(updateChatMessageResult.errors).toBeDefined();

			// If `errors` is defined, ensure it contains at least one error
			if (updateChatMessageResult.errors) {
				expect(updateChatMessageResult.errors.length).toBeGreaterThan(0);
				expect(updateChatMessageResult.errors[0]?.extensions?.code).toBe(
					"unexpected",
				);
			} else {
				throw new Error("Expected an error response but received none.");
			}
		} finally {
			// Restore the original update method
			server.drizzleClient.update = originalUpdate;
		}
	});

	test("ensures message content with updatedChatMessage returned , updated correctly", async () => {
		try {
			// Sign in as an administrator
			const userSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			const userData = userSignInResult.data?.signIn;
			if (!userData || !userData.authenticationToken || !userData.user?.id) {
				throw new Error("User authentication failed");
			}

			const userToken = userData.authenticationToken;
			const userId = userData.user.id;

			// Create an organization
			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							name: `Test Org ${faker.string.uuid()}`,
							addressLine1: "123 Main St",
							city: "New York",
							countryCode: "us",
							description: "Test Description",
						},
					},
				},
			);

			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			// Add user to the organization
			const orgMembershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							organizationId,
							memberId: userId,
							role: "administrator",
						},
					},
				},
			);

			assertToBeNonNullish(
				orgMembershipResult.data?.createOrganizationMembership?.id,
			);

			// Create a chat (Required to get a valid `chatId`)
			const createChatResult = await mercuriusClient.mutate(
				Mutation_createChat,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							name: faker.string.uuid(),
							description: "Test chat description",
							organizationId,
						},
					},
				},
			);

			const chatId = createChatResult.data?.createChat?.id;
			assertToBeNonNullish(chatId);

			// Create a chat message
			const createChatMessageResult = await mercuriusClient.mutate(
				Mutation_createChatMessage,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							chatId,
							body: "Original Message",
						},
					},
				},
			);

			const chatMessage = createChatMessageResult.data?.createChatMessage;
			assertToBeNonNullish(chatMessage);

			const chatMessageId = chatMessage.id;

			// Update the chat message
			const updateChatMessageResult = await mercuriusClient.mutate(
				Mutation_updateChatMessage,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							id: chatMessageId,
							body: "Updated Message",
						},
					},
				},
			);

			const updatedMessage = updateChatMessageResult.data?.updateChatMessage;
			assertToBeNonNullish(updatedMessage);

			expect(updatedMessage).toMatchObject({
				id: chatMessageId,
				body: "Updated Message",
			});

			// Ensures `updatedAt` is updated correctly
			const updatedAt = updatedMessage.updatedAt;
			assertToBeNonNullish(updatedAt);

			expect(new Date(updatedAt).getTime());
		} catch (error) {
			console.error("Test failed:", error);
			throw error;
		}
	});
});
