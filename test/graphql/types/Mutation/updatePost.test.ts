import { expect, suite, test, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Query_signIn,
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_updatePost,
	Mutation_deleteCurrentUser,
	Mutation_createUser,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
assertToBeNonNullish(adminToken);


suite("Mutation field updatePost", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_updatePost, {
				variables: {
					input: {
						id: faker.string.uuid(),
						caption: "New Caption",
					},
				},
			});
			expect(result.data?.updatePost ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

	suite("when the specified post does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const authToken = signInResult.data?.signIn?.authenticationToken ?? null;
			assertToBeNonNullish(authToken);

			const result = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						caption: "Updated Caption",
					},
				},
			});
			expect(result.data?.updatePost ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

	suite("when current user is administrator but not the creator", () => {
		test("should return an error with unauthorized_arguments code", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const authToken = signInResult.data?.signIn?.authenticationToken ?? null;
			assertToBeNonNullish(authToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Update Post Org",
							description: "Organization for update post test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							caption: "Original Caption",
							organizationId: orgId,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const originalPostFindFirst =
				server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					pinnedAt: null,
					creatorId: "different-admin-id", 
					attachmentsWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				});

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: postId,
						caption: "Updated Caption",
					},
				},
			});

			server.drizzleClient.query.postsTable.findFirst = originalPostFindFirst;

			expect(updateResult.data?.updatePost ?? null).toBeNull();
			expect(updateResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "caption"],
								}),
							]),
						}),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

	suite(
		"when non-admin user (member) attempts update and is not the creator",
		() => {
			test("should return an error with unauthorized_action_on_arguments_associated_resources", async () => {
				const { authToken: regularAuthToken, userId } = await import(
					"../createRegularUserUsingAdmin"
				).then((module) => module.createRegularUserUsingAdmin());
				assertToBeNonNullish(regularAuthToken);
				assertToBeNonNullish(userId);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Member Update Org",
								description: "For update test by non-admin member",
								countryCode: "us",
								state: "TX",
								city: "Houston",
								postalCode: "77001",
								addressLine1: "10 Main St",
								addressLine2: "Suite 200",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);

				const createPostResult = await mercuriusClient.mutate(
					Mutation_createPost,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								caption: "Original Caption",
								organizationId: orgId,
							},
						},
					},
				);
				const postId = createPostResult.data?.createPost?.id;
				assertToBeNonNullish(postId);

				const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: {
						input: {
							id: postId,
							caption: "Attempted Update by Member",
						},
					},
				});
				expect(updateResult.data?.updatePost ?? null).toBeNull();
				expect(updateResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({ argumentPath: ["input", "id"] }),
								]),
							}),
							path: ["updatePost"],
						}),
					]),
				);
			});
		},
	);
	suite("updatePost - pinnedAt update branch", () => {
		test("should update pinnedAt to a new Date when isPinned is true and existingPost.pinnedAt is null", async () => {

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Pin Update Org",
							description: "Org for update pin test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							caption: "Post to update pin",
							organizationId: orgId,
							isPinned: false,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: postId,
						caption: "Updated Caption",
						isPinned: true,
					},
				},
			});

			const updatedPost = updateResult.data?.updatePost;
			expect(updatedPost).toBeDefined();
			expect(updatedPost?.pinnedAt).not.toBeNull();
			expect(new Date(updatedPost?.pinnedAt ?? "").toString()).not.toBe(
				"Invalid Date",
			);
		});
	});

	suite("when updatePost arguments fail validation", () => {
		test("should return an error with invalid_arguments code", async () => {

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						caption: null, 
					},
				},
			});

			expect(updateResult.data?.updatePost ?? null).toBeNull();
			expect(updateResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
									message: expect.any(String),
								}),
							]),
						}),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Test Org for Missing User",
							description: "Org for updatePost test when user is deleted",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						caption: "Updated Caption",
					},
				},
			});

			expect(updateResult.data?.updatePost ?? null).toBeNull();
			expect(updateResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

	suite("when current user is non-admin member and not the creator", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Non-admin Update Org",
							description: "Org for non-admin update post test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "456 Second St",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { authToken: regularAuthToken, userId } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);
			assertToBeNonNullish(userId);

			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					pinnedAt: null,
					creatorId: "different-creator-id", 
					attachmentsWherePost: [],
					organization: { membershipsWhereOrganization: [{ role: "member" }] },
				});

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						caption: "Updated Caption",
					},
				},
			});
			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;

			expect(updateResult.data?.updatePost ?? null).toBeNull();
			expect(updateResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updatePost"],
					}),
				]),
			);
		});
	});

        //An another test suite will be written here after the join button is implemented"

	suite(
		"when current user is organization admin but not the creator and tries to update caption",
		() => {
			test("should return an error with unauthorized_arguments code", async () => {
				const { authToken: regularUserToken, userId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularUserToken);
				assertToBeNonNullish(userId);

				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				const adminToken =
					adminSignInResult.data?.signIn?.authenticationToken ?? null;
				assertToBeNonNullish(adminToken);

				// Create an organization
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Org Admin Test Org",
								description: "Testing org admin unauthorized caption",
								countryCode: "us",
								state: "CA",
								city: "San Francisco",
								postalCode: "94101",
								addressLine1: "123 Main St",
								addressLine2: "Suite 100",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);
				const createPostResult = await mercuriusClient.mutate(
					Mutation_createPost,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								caption: "Original Caption",
								organizationId: orgId,
							},
						},
					},
				);
				const postId = createPostResult.data?.createPost?.id;
				assertToBeNonNullish(postId);
				const originalFindFirst =
					server.drizzleClient.query.postsTable.findFirst;
				server.drizzleClient.query.postsTable.findFirst = vi
					.fn()
					.mockResolvedValue({
						pinnedAt: null,
						creatorId: "different-creator-id",
						attachmentsWherePost: [],
						organization: {
							countryCode: "us",
							membershipsWhereOrganization: [
								{
									role: "administrator",
								},
							],
						},
					});

				try {
					const updateResult = await mercuriusClient.mutate(
						Mutation_updatePost,
						{
							headers: { authorization: `bearer ${regularUserToken}` },
							variables: {
								input: {
									id: postId,
									caption: "Updated Caption",
								},
							},
						},
					);
					expect(updateResult.data?.updatePost ?? null).toBeNull();
					expect(updateResult.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unauthorized_arguments",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["input", "caption"],
										}),
									]),
								}),
								path: ["updatePost"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				}
			});
		},
	);

	suite("updatePost - pinnedAt setting to null", () => {
		test("should update pinnedAt to null when isPinned is false and existingPost.pinnedAt is not null", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Unpin Update Org",
							description: "Org for unpinning test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							caption: "Post to unpin",
							organizationId: orgId,
							isPinned: true,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);
			expect(createPostResult.data?.createPost?.pinnedAt).not.toBeNull();

			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: postId,
						caption: "Updated Caption",
						isPinned: false,
					},
				},
			});
			const updatedPost = updateResult.data?.updatePost;
			expect(updatedPost).toBeDefined();
			expect(updatedPost?.pinnedAt).toBeNull();
		});
	});

	suite("when regular member tries to update isPinned attribute", () => {
		test("should return an error with unauthorized_arguments code", async () => {
			const { authToken: regularUserToken, userId } =
				await createRegularUserUsingAdmin();

			if (!regularUserToken || !userId) {
				console.log("Helper function failed, creating user manually");
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
				assertToBeNonNullish(adminToken);

				const email = `testuser-${faker.string.ulid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								emailAddress: email,
								isEmailAddressVerified: true,
								name: "Test Regular User",
								password: "password123",
								role: "regular",
							},
						},
					},
				);

				const newUserId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(newUserId);
				const userSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: email,
							password: "password123",
						},
					},
				});
				const newUserToken = userSignInResult.data?.signIn?.authenticationToken;
				assertToBeNonNullish(newUserToken);
			}

			let newUserToken: string | null | undefined;
			let newUserId: string | null | undefined;
			const userToken = regularUserToken || newUserToken;
			const userIdToUse = userId || newUserId;
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userIdToUse);
		});
	});

	suite("when regular member tries to update isPinned attribute", () => {
		test("should return an error with unauthorized_arguments code", async () => {
			const email = `testuser-${faker.string.ulid()}@example.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: email,
							isEmailAddressVerified: true,
							name: "Test Regular User",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			const userId = createUserResult.data?.createUser?.user?.id;
			assertToBeNonNullish(userId);
			const userSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: email,
						password: "password123",
					},
				},
			});
			const regularUserToken =
				userSignInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(regularUserToken);
		});
	});

});
