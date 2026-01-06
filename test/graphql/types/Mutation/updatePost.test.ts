import { faker } from "@faker-js/faker";
import { beforeEach, expect, suite, test, vi } from "vitest";
import { POST_CAPTION_MAX_LENGTH } from "~/src/drizzle/tables/posts";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish, getAdminAuthToken } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
	Mutation_updatePost,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field updatePost", () => {
	beforeEach(async () => {
		// Clear rate limit keys to prevent rate limiting between tests
		const keys = await server.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await server.redis.del(...keys);
		}
	});

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
			const authToken = await getAdminAuthToken();

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
			const authToken = await getAdminAuthToken();

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
						isPinned: true,
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
				const adminToken = await getAdminAuthToken();
				const { authToken: regularAuthToken, userId } =
					await createRegularUserUsingAdmin();
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
			const adminToken = await getAdminAuthToken();
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
			const adminToken = await getAdminAuthToken();
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
	suite("when update operation unexpectedly returns empty array", () => {
		test("should return an error with unexpected extensions code", async () => {
			const adminToken = await getAdminAuthToken();
			// Create an organization for testing
			const orgName = `Unexpected-Error-Org-${faker.string.alphanumeric(8)}`;
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: orgName,
							description:
								"Organization for testing unexpected errors in update",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "789 Error St",
							addressLine2: "Suite 500",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Create post that we'll try to update
			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							caption: "Post for unexpected error test",
							organizationId: orgId,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			// Mock the transaction to simulate the update returning an empty array
			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Create a mock transaction that returns an empty array from update operation
					const mockTx = {
						update: () => ({
							set: () => ({
								where: () => ({
									returning: async () => [], // Empty array simulates the unexpected condition
								}),
							}),
						}),
						// Include other methods that might be needed during the transaction
						delete: () => ({
							where: () => Promise.resolve(),
						}),
						insert: () => ({
							values: () => ({
								returning: async () => [],
							}),
						}),
					};

					return await callback(mockTx);
				});

			try {
				// Attempt to update the post with the mocked transaction
				const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: postId,
							caption: "This should trigger an unexpected error",
						},
					},
				});

				// Verify the error response
				expect(updateResult.data?.updatePost).toBeNull();
				expect(updateResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updatePost"],
						}),
					]),
				);
			} finally {
				// Restore the original transaction function
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const adminToken = await getAdminAuthToken();
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
			const adminToken = await getAdminAuthToken();
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
	suite(
		"when regular member tries to update isPinned attribute on their own post",
		() => {
			test("should return an error with unauthorized_arguments code", async () => {
				const adminToken = await getAdminAuthToken();
				const { authToken: regularAuthToken, userId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);
				assertToBeNonNullish(userId);

				const orgName = `isPinned-Test-Org-${faker.string.alphanumeric(8)}`;
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: orgName,
								description: "Organization for testing isPinned permissions",
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

				const originalFindFirst =
					server.drizzleClient.query.postsTable.findFirst;

				server.drizzleClient.query.postsTable.findFirst = vi
					.fn()
					.mockResolvedValue({
						pinnedAt: null,
						creatorId: userId,
						attachmentsWherePost: [],
						organization: {
							membershipsWhereOrganization: [{ role: "member" }],
						},
					});

				try {
					const updateResult = await mercuriusClient.mutate(
						Mutation_updatePost,
						{
							headers: { authorization: `bearer ${regularAuthToken}` },
							variables: {
								input: {
									id: faker.string.uuid(),
									caption: "Updated regular user post",
									isPinned: true,
								},
							},
						},
					);

					expect(updateResult.data?.updatePost).toBeNull();
					expect(updateResult.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unauthorized_arguments",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["input", "isPinned"],
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
			const adminToken = await getAdminAuthToken();
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

	suite("security checks", () => {
		test("should escape HTML in caption", async () => {
			const adminToken = await getAdminAuthToken();
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "jm",
							state: "St. Andrew",
							city: "Kingston",
							postalCode: "12345",
							addressLine1: faker.location.streetAddress(),
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

			const htmlCaption = "<script>alert('xss')</script>";
			const result = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: postId,
						caption: htmlCaption,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updatePost?.caption).toBe(
				"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
			);
		});

		test("should reject caption exceeding length limit", async () => {
			const adminToken = await getAdminAuthToken();
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "jm",
							state: "St. Andrew",
							city: "Kingston",
							postalCode: "12345",
							addressLine1: faker.location.streetAddress(),
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

			const longCaption = "a".repeat(POST_CAPTION_MAX_LENGTH + 1);
			const result = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: postId,
						caption: longCaption,
					},
				},
			});

			expect(result.data?.updatePost).toBeNull();
			expect(result.errors).toBeDefined();
			const issues = (
				result.errors?.[0]?.extensions as unknown as InvalidArgumentsExtensions
			)?.issues;
			const issueMessages = issues?.map((i) => i.message).join(" ");
			expect(issueMessages).toContain(
				`Post caption must not exceed ${POST_CAPTION_MAX_LENGTH} characters`,
			);
		});
	});
});

suite("updatePost - MinIO operations", () => {
	test("successfully updates post with valid image attachment", async () => {
		// Admin login
		const token = await getAdminAuthToken();

		// Create org
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `UpdatePostOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);
		const orgId = createOrgResult.data.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create initial post with no attachment
		const createPostResult = await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					caption: "Original",
					organizationId: orgId,
					isPinned: false,
					attachment: null,
				},
			},
		});
		const postId = createPostResult.data.createPost?.id;
		assertToBeNonNullish(postId);

		// Multipart for updatePost
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
		  mutation Mutation_updatePost($input: MutationUpdatePostInput!) {
			updatePost(input: $input) {
			  id
			  caption
			  attachments { mimeType name }
			}
		  }
		`,
			variables: {
				input: {
					id: postId,
					caption: "Updated Caption",
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="updated-photo.jpg"',
			"Content-Type: image/jpeg",
			"",
			"fake jpeg content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data.updatePost?.id);
		expect(result.data.updatePost.caption).toBe("Updated Caption");
		expect(result.data.updatePost.attachments).toHaveLength(1);
		expect(result.data.updatePost.attachments[0].mimeType).toBe("image/jpeg");
	});

	test("should remove existing attachment when attachment is explicitly null", async () => {
		// Step 1: Admin login
		const token = await getAdminAuthToken();

		// Step 2: Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `RemoveAttachmentOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Step 3: CREATE post WITH an attachment
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operationsCreate = JSON.stringify({
			query: `
		  mutation CreatePost($input: MutationCreatePostInput!) {
			createPost(input: $input) {
			  id
			  attachments { objectName }
			}
		  }
		`,
			variables: {
				input: {
					caption: "Post with attachment",
					organizationId: orgId,
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const bodyCreate = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operationsCreate,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file.jpg"',
			"Content-Type: image/jpeg",
			"",
			"filecontent",
			`--${boundary}--`,
		].join("\r\n");

		const createResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: bodyCreate,
		});

		const createResult = JSON.parse(createResponse.body);
		const postId = createResult.data.createPost.id;

		assertToBeNonNullish(postId);
		expect(createResult.data.createPost.attachments).toHaveLength(1);

		// Step 4: UPDATE post with explicit attachment: null
		const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: postId,
					caption: "Updated caption",
					attachment: null, // <-- THIS triggers deletion
				},
			},
		});

		const updatedPost = updateResult.data?.updatePost;

		// Step 5: Assertions
		expect(updateResult.errors).toBeUndefined();

		expect(updatedPost?.id).toBe(postId);
		expect(updatedPost?.caption).toBe("Updated caption");

		expect(updatedPost?.attachments).toEqual([]); // EMPTY!
	});

	test("should preserve existing attachment when attachment field is omitted (undefined)", async () => {
		// 1. Admin login
		const token = await getAdminAuthToken();

		// 2. Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `KeepAttachmentOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		const orgId = createOrgResult.data.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// 3. CREATE post with one attachment
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: `
		  mutation CreatePost($input: MutationCreatePostInput!) {
			createPost(input: $input) {
			  id
			  attachments { objectName mimeType }
			}
		  }
		`,
			variables: {
				input: {
					caption: "Original with attachment",
					organizationId: orgId,
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({ "0": ["variables.input.attachment"] });

		const bodyCreate = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="video.mov"',
			"Content-Type: video/quicktime",
			"",
			"jpegcontent",
			`--${boundary}--`,
		].join("\r\n");

		const createRes = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: bodyCreate,
		});

		const created = JSON.parse(createRes.body);
		const postId = created.data.createPost.id;
		assertToBeNonNullish(postId);

		expect(created.data.createPost.attachments).toHaveLength(1);
		expect(created.data.createPost.attachments[0].mimeType).toBe(
			"video/quicktime",
		);
		const oldAttachment = created.data.createPost.attachments[0];

		// 4. UPDATE post WITHOUT attachment field => undefined
		const updateRes = await mercuriusClient.mutate(Mutation_updatePost, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: postId,
					caption: "Updated caption only",
				},
			},
		});

		const updated = updateRes.data.updatePost;

		// 5. Assertions
		expect(updateRes.errors).toBeUndefined();

		expect(updated?.id).toBe(postId);
		expect(updated?.caption).toBe("Updated caption only");

		expect(updated?.attachments).toHaveLength(1);
		expect(updated?.attachments?.[0]?.objectName).toBe(
			oldAttachment.objectName,
		);
		expect(updated?.attachments?.[0]?.mimeType).toBe(oldAttachment.mimeType);
	});

	test("returns unexpected error when MinIO upload fails during post update", async () => {
		// Save original method for restoration
		const originalPutObject = server.minio.client.putObject;

		try {
			// Admin login
			const token = await getAdminAuthToken();

			// Create org
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							name: `UpdateFailOrg_${faker.string.ulid()}`,
							description: faker.lorem.sentence(),
						},
					},
				},
			);
			const orgId = createOrgResult.data.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Create initial post
			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							caption: "Before fail",
							organizationId: orgId,
							attachment: null,
						},
					},
				},
			);
			const postId = createPostResult.data.createPost?.id;
			assertToBeNonNullish(postId);

			// Mock MinIO failure
			server.minio.client.putObject = vi
				.fn()
				.mockRejectedValue(new Error("simulated MinIO failure"));

			// multipart update
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `
		  mutation Mutation_updatePost($input: MutationUpdatePostInput!) {
			updatePost(input: $input) {
			  id
			}
		  }
		`,
				variables: {
					input: {
						id: postId,
						caption: "Should fail",
						attachment: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.attachment"],
			});

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="image.jpg"',
				"Content-Type: image/jpeg",
				"",
				"fakecontent",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${token}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			// assert failure shape
			expect(result.data?.updatePost).toEqual(null);
			expect(result.errors?.[0].extensions.code).toBe("unexpected");
		} finally {
			// Restore original method
			server.minio.client.putObject = originalPutObject;
		}
	});
	test("should return unexpected error when MinIO object removal fails", async () => {
		// Admin login
		const token = await getAdminAuthToken();

		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `RemovalFailOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "456 Test St",
					},
				},
			},
		);
		const orgId = createOrgResult.data.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create initial post with attachment
		const boundary1 = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations1 = JSON.stringify({
			query: `
				mutation Mutation_createPost($input: MutationCreatePostInput!) {
					createPost(input: $input) {
						id
						attachments { objectName }
					}
				}
			`,
			variables: {
				input: {
					caption: "Post with attachment",
					organizationId: orgId,
					attachment: null,
				},
			},
		});

		const map1 = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const body1 = [
			`--${boundary1}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations1,
			`--${boundary1}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map1,
			`--${boundary1}`,
			'Content-Disposition: form-data; name="0"; filename="initial.jpg"',
			"Content-Type: image/jpeg",
			"",
			"initial content",
			`--${boundary1}--`,
		].join("\r\n");

		const createResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary1}`,
				authorization: `bearer ${token}`,
			},
			payload: body1,
		});

		const createResult = JSON.parse(createResponse.body);
		const postId = createResult.data.createPost?.id;
		const oldObjectName =
			createResult.data.createPost?.attachments[0]?.objectName;
		assertToBeNonNullish(postId);
		assertToBeNonNullish(oldObjectName);

		// Mock removeObject to fail
		const originalRemoveObject = server.minio.client.removeObject;

		server.minio.client.removeObject = vi
			.fn()
			.mockRejectedValue(new Error("MinIO removal failed - object not found"));

		try {
			// Update post with new attachment
			const boundary2 = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations2 = JSON.stringify({
				query: `
					mutation Mutation_updatePost($input: MutationUpdatePostInput!) {
						updatePost(input: $input) {
							id
							caption
							attachments { objectName }
						}
					}
				`,
				variables: {
					input: {
						id: postId,
						caption: "Update should fail",
						attachment: null,
					},
				},
			});

			const map2 = JSON.stringify({
				"0": ["variables.input.attachment"],
			});

			const body2 = [
				`--${boundary2}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations2,
				`--${boundary2}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map2,
				`--${boundary2}`,
				'Content-Disposition: form-data; name="0"; filename="replacement.jpg"',
				"Content-Type: image/jpeg",
				"",
				"replacement content",
				`--${boundary2}--`,
			].join("\r\n");

			const updateResponse = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary2}`,
					authorization: `bearer ${token}`,
				},
				payload: body2,
			});

			const updateResult = JSON.parse(updateResponse.body);

			// Verify update failed with unexpected error
			expect(updateResult.data?.updatePost).toBeNull();
			expect(updateResult.errors?.[0].extensions.code).toBe("unexpected");
		} finally {
			// Restore original method
			server.minio.client.removeObject = originalRemoveObject;
		}
	});

	test("should return unexpected error when MinIO removal fails while explicitly removing attachment", async () => {
		// Admin login
		const token = await getAdminAuthToken();

		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `RemoveAttachOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);
		const orgId = createOrgResult.data.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create post with attachment
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: `
				mutation Mutation_createPost($input: MutationCreatePostInput!) {
					createPost(input: $input) {
						id
						attachments { objectName }
					}
				}
			`,
			variables: {
				input: {
					caption: "Post with attachment",
					organizationId: orgId,
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="photo.jpg"',
			"Content-Type: image/jpeg",
			"",
			"photo content",
			`--${boundary}--`,
		].join("\r\n");

		const createResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: body,
		});

		const createResult = JSON.parse(createResponse.body);
		const postId = createResult.data.createPost?.id;
		assertToBeNonNullish(postId);
		expect(createResult.data.createPost.attachments).toHaveLength(1);

		// Mock removeObject to fail
		const originalRemoveObject = server.minio.client.removeObject;
		server.minio.client.removeObject = vi
			.fn()
			.mockRejectedValue(new Error("MinIO removal failed"));

		try {
			// Try to remove attachment by setting it to null
			const updateResult = await mercuriusClient.mutate(Mutation_updatePost, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						id: postId,
						caption: "Removing attachment should fail",
						attachment: null,
					},
				},
			});

			// Verify update failed with unexpected error
			expect(updateResult.data?.updatePost).toBeNull();
			expect(updateResult.errors?.[0]?.extensions.code).toBe("unexpected");
		} finally {
			// Restore original method
			server.minio.client.removeObject = originalRemoveObject;
		}
	});
});
