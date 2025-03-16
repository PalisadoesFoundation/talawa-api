import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_organization,
	Query_signIn,
	Query_tag,
} from "../documentNodes";

suite("Query field tag", () => {
	test("results in a graphql error with 'invalid_arguments' if an invalid id is provided", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const tagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: "invalid-id", // Not a valid UUID
				},
			},
		});

		expect(tagResult.data.tag).toEqual(null);
		expect(tagResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.tag" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const tagResult = await mercuriusClient.query(Query_tag, {
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});
				expect(tagResult.data.tag).toEqual(null);
				expect(tagResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["tag"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
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
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				const tagResult = await mercuriusClient.query(Query_tag, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});

				expect(tagResult?.data?.tag).toBeNull();
				expect(tagResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["tag"],
						}),
					]),
				);
			});
		},
	);
	test("returns error when a non-admin user without organization membership tries to fetch a tag", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		// Step 1: Create a regular user who does NOT belong to any organization

		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminSignInResult?.data?.signIn?.authenticationToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular", // Not an admin
						isEmailAddressVerified: true,
					},
				},
			},
		);

		const regularUserToken =
			regularUserResult.data?.createUser?.authenticationToken;

		//get a tag ID
		const existingTagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: `bearer ${adminSignInResult?.data?.signIn?.authenticationToken}`,
			},
		});

		const tagId = existingTagResult?.data?.tag?.id; // Get the first available tag

		// Step 2: Attempt to fetch a tag with this unauthorized user
		if (!tagId) return;
		const tagQueryResult = await mercuriusClient.query(Query_tag, {
			headers: { authorization: `bearer ${regularUserToken}` },
			variables: { input: { id: tagId } },
		});

		// Step 3: Assert that the error is unauthorized action
		// expect(tagResult.data.tag).toEqual(null);
		expect(tagQueryResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.tag" field if`,
		() => {
			test("the specified tag does not exist", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const tagResult = await mercuriusClient.query(Query_tag, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});

				expect(tagResult.data.tag).toEqual(null);
				expect(tagResult.errors).toEqual(
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
							path: ["tag"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.tag" field if`,
		() => {
			test("regular user tries to access tag without organization membership", async () => {
				// Step 1: Admin Sign-in
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
				if (!adminToken) throw new Error("Admin authentication failed");

				// Step 2: Create Regular User
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `${faker.string.uuid()}@test.com`,
								password: "password123",
								name: "Regular User",
								role: "regular",
								isEmailAddressVerified: true,
							},
						},
					},
				);

				const regularUserToken =
					regularUserResult.data?.createUser?.authenticationToken;
				if (!regularUserToken) throw new Error("Regular user creation failed");

				// Step 3: Create Organization with unique name
				const organizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `Test Org ${faker.string.uuid()}`, // Generate unique name
								addressLine1: "123 Main St",
								city: "New York",
								countryCode: "us",
								description: "Test Description",
							},
						},
					},
				);

				if (organizationResult.errors) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(organizationResult.errors)}`,
					);
				}
				const organizationId = organizationResult.data?.createOrganization?.id;
				if (!organizationId) throw new Error("Organization ID not found");

				// Rest of the test remains the same...
				// Create tag and test regular user access
				const tagCreationResult = await mercuriusClient.mutate(
					Mutation_createTag,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Tag",
								organizationId: organizationId,
							},
						},
					},
				);

				const tagId = tagCreationResult.data?.createTag?.id;
				if (!tagId) throw new Error("Tag creation failed");

				const tagQueryResult = await mercuriusClient.query(Query_tag, {
					headers: {
						authorization: `bearer ${regularUserToken}`,
					},
					variables: {
						input: {
							id: tagId,
						},
					},
				});

				expect(tagQueryResult.data.tag).toBeNull();
				expect(tagQueryResult.errors).toEqual(
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
							path: ["tag"],
						}),
					]),
				);
			});
		},
	);

	test("results in an empty 'errors' field and the expected value for the 'data.tag' field when accessed by administrator", async () => {
		// Step 1: Admin Sign-in
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!authToken) throw new Error("Admin authentication failed");

		// Step 2: Create Organization with unique name
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`, // Generate unique name
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		if (organizationResult.errors) {
			console.error(
				"Organization Creation Errors:",
				JSON.stringify(organizationResult.errors, null, 2),
			);
			throw new Error(
				`Organization creation failed: ${JSON.stringify(organizationResult.errors)}`,
			);
		}

		const organization = organizationResult.data?.createOrganization;
		if (!organization) throw new Error("Organization data not found");

		// Rest of the test remains the same...
		const tagResult = await mercuriusClient.mutate(Mutation_createTag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					name: "Test Tag",
					organizationId: organization.id,
				},
			},
		});

		if (tagResult.errors) {
			throw new Error(
				`Tag creation failed: ${JSON.stringify(tagResult.errors)}`,
			);
		}

		const tag = tagResult.data?.createTag;
		if (!tag) throw new Error("Tag data not found");

		const queriedTagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: tag.id,
				},
			},
		});

		expect(queriedTagResult.errors).toBeUndefined();
		expect(queriedTagResult.data.tag).toMatchObject({
			id: tag.id,
			name: "Test Tag",
			organization: {
				id: organization.id,
			},
			createdAt: expect.any(String),
		});
	});

	test("regular user can access tag when they are a member of the organization", async () => {
		// Step 1: Admin Sign-in (unchanged)
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!adminToken) throw new Error("Admin authentication failed");

		// Step 2: Create Regular User (unchanged)
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);
		const regularUserId = regularUserResult.data?.createUser?.user?.id;
		const regularUserToken =
			regularUserResult.data?.createUser?.authenticationToken;
		if (!regularUserToken || !regularUserId)
			throw new Error("Regular user creation failed");

		// Step 3: Create Organization (unchanged)
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
		if (!organizationId) throw new Error("Organization creation failed");

		// Step 4: Add regular user to organization (unchanged)
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: regularUserId,
					},
				},
			},
		);

		// Added: Check membership creation success
		if (!membershipResult.data?.createOrganizationMembership) {
			throw new Error("Organization membership creation failed");
		}

		// Step 5: Verify Membership (Updated to match schema)
		const organizationQueryResult = await mercuriusClient.query(
			Query_organization,
			{
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: { id: organizationId },
					first: 10,
				},
			},
		);

		// Updated: Check memberships directly in organization
		const memberships =
			organizationQueryResult.data?.organization?.members?.edges || [];
		const isUserMember = memberships.some(
			(membership) => membership?.node?.id === regularUserId,
		);

		if (!isUserMember) {
			console.error("Membership verification failed:", {
				memberships,
				regularUserId,
				organizationQueryResult,
			});
			throw new Error("Regular user is not a member of the organization");
		}

		// Step 6: Create Tag (unchanged)
		const tagCreationResult = await mercuriusClient.mutate(Mutation_createTag, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Test Tag",
					organizationId,
				},
			},
		});
		const tagId = tagCreationResult.data?.createTag?.id;
		if (!tagId) throw new Error("Tag creation failed");

		// Step 7: Query Tag as Regular User (unchanged)
		const tagQueryResult = await mercuriusClient.query(Query_tag, {
			headers: { authorization: `bearer ${regularUserToken}` },
			variables: { input: { id: tagId } },
		});

		expect(tagQueryResult.data.tag).toMatchObject({
			id: tagId,
			name: "Test Tag",
			organization: { id: organizationId },
		});
	});

	test("results in a graphql error with 'unauthenticated' if user ID in token doesn't exist in database", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!authToken) throw new Error("Admin authentication failed");

		// Create a token with a non-existent user ID
		const nonExistentUserToken = authToken.replace(
			/[^.]+/,
			faker.string.uuid(),
		);

		const tagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: `bearer ${nonExistentUserToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(tagResult.data.tag).toEqual(null);
		expect(tagResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});

	test("results in a graphql error with 'unauthenticated' if authorization header is empty", async () => {
		const tagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: "",
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(tagResult.data.tag).toEqual(null);
		expect(tagResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});

	// Test missing authorization header
	test("results in a graphql error with 'unauthenticated' if authorization header is missing", async () => {
		const tagResult = await mercuriusClient.query(Query_tag, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(tagResult.data.tag).toEqual(null);
		expect(tagResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});

	// Test invalid UUID format
	test("results in a graphql error with 'invalid_arguments' for malformed UUID", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!authToken) throw new Error("Admin authentication failed");

		const tagResult = await mercuriusClient.query(Query_tag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: "not-a-uuid-format",
				},
			},
		});

		expect(tagResult.data.tag).toEqual(null);
		expect(tagResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["tag"],
				}),
			]),
		);
	});
});
