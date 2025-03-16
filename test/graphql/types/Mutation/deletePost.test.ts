import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteCurrentUser,
	Mutation_deletePost,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
const adminauthToken = signInResult.data.signIn.authenticationToken;

suite("Mutation field deletePost", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_deletePost, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deletePost).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["deletePost"],
					}),
				]),
			);
		});
	});

	suite("when the specified post does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const randomPostId = faker.string.uuid();

			const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
				headers: {
					authorization: `bearer ${adminauthToken}`,
				},
				variables: {
					input: { id: randomPostId },
				},
			});

			expect(deleteResult.data?.deletePost).toBeNull();
			expect(deleteResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["deletePost"],
					}),
				]),
			);
		});
	});

	suite("when the client is not authorized to delete the post", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code", async () => {
			const createOrganizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${adminauthToken}`,
					},
					variables: {
						input: {
							name: "test",
							description: "test",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "test",
							addressLine1: "test",
							addressLine2: "test",
						},
					},
				},
			);
			const existingOrganizationId =
				createOrganizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(existingOrganizationId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: {
						authorization: `bearer ${adminauthToken}`,
					},
					variables: {
						input: {
							caption: "Unauthorized deletion test",
							organizationId: existingOrganizationId,
							isPinned: false,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const { authToken: regularAuthToken } =
				await createRegularUserUsingAdmin();

			// Attempt to delete the post as the regular user.
			const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: { input: { id: postId } },
			});

			expect(deleteResult.data?.deletePost).toBeNull();
			expect(deleteResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["deletePost"],
					}),
				]),
			);
		});
	});

	suite("when the arguments are invalid", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_deletePost, {
				headers: { authorization: `bearer ${adminauthToken}` },
				variables: {
					input: { id: "invalid-uuid" },
				},
			});

			expect(result.data?.deletePost ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["deletePost"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist in the database", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { authToken } = await createRegularUserUsingAdmin();

			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${authToken}` },
			});

			const randomPostId = faker.string.uuid();
			const result = await mercuriusClient.mutate(Mutation_deletePost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: randomPostId } },
			});

			expect(result.data?.deletePost ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["deletePost"],
					}),
				]),
			);
		});
	});

	suite(
		"when a non-admin member attempts to delete another user's post",
		() => {
			test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code", async () => {
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminauthToken}` },
						variables: {
							input: {
								name: "test-membership",
								description: "test-membership",
								countryCode: "us",
								state: "test",
								city: "test",
								postalCode: "test",
								addressLine1: "test",
								addressLine2: "test",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);

				const createPostResult = await mercuriusClient.mutate(
					Mutation_createPost,
					{
						headers: { authorization: `bearer ${adminauthToken}` },
						variables: {
							input: {
								caption: "Test membership unauthorized deletion",
								organizationId: orgId,
								isPinned: false,
							},
						},
					},
				);
				const postId = createPostResult.data?.createPost?.id;
				assertToBeNonNullish(postId);

				const { authToken: regularAuthToken, userId: regularUserId } =
					await createRegularUserUsingAdmin();

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: {
						input: {
							role: "regular",
							organizationId: orgId,
							memberId: regularUserId,
						},
					},
				});

				// Attempt to delete the post as the regular user.
				const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: { input: { id: postId } },
				});

				expect(deleteResult.data?.deletePost).toBeNull();
				expect(deleteResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
							}),
							path: ["deletePost"],
						}),
					]),
				);
			});
		},
	);

	suite("when the deletion transaction returns no deleted post", () => {
		test("should return an error with unexpected extensions code", async () => {
			// Create organization and post as admin.
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: {
						input: {
							name: "test-transaction",
							description: "test-transaction",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "test",
							addressLine1: "test",
							addressLine2: "test",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: {
						input: {
							caption: "Test deletion transaction",
							organizationId: orgId,
							isPinned: false,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const originalTransaction = server.drizzleClient.transaction;
			const fakeTransaction = async <T>(
				fn: (tx: unknown) => Promise<T>,
			): Promise<T> => {
				return await fn({
					delete: () => ({
						where: () => ({
							returning: async () => {
								return [];
							},
						}),
					}),
				});
			};

			try {
				server.drizzleClient.transaction =
					fakeTransaction as typeof server.drizzleClient.transaction;

				const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: { input: { id: postId } },
				});

				expect(deleteResult.data?.deletePost ?? null).toBeNull();
				expect(deleteResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["deletePost"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when minio removal fails", () => {
		test("should bubble up an error from the minio removal and not delete the post", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: {
						input: {
							name: "test-minio-failure",
							description: "test-minio-failure",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "test",
							addressLine1: "test",
							addressLine2: "test",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: {
						input: {
							caption: "Test minio failure",
							organizationId: orgId,
							isPinned: false,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const originalRemoveObjects = server.minio.client.removeObjects;
			try {
				server.minio.client.removeObjects = async () => {
					throw new Error("Minio removal error");
				};

				const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
					headers: { authorization: `bearer ${adminauthToken}` },
					variables: { input: { id: postId } },
				});

				expect(deleteResult.data?.deletePost ?? null).toBeNull();
				expect(deleteResult.errors).toBeDefined();
				expect(deleteResult.errors?.[0]?.message).toContain(
					"Minio removal error",
				);
			} finally {
				server.minio.client.removeObjects = originalRemoveObjects;
			}
		});
	});

	suite("when the client is authorized and the post exists", () => {
		test("should delete the post and return the deleted post data", async () => {
			const createOrganizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${adminauthToken}`,
					},
					variables: {
						input: {
							name: "test-2",
							description: "test-2",
							countryCode: "us",
							state: "test-2",
							city: "test-2",
							postalCode: "test-2",
							addressLine1: "test-2",
							addressLine2: "test-2",
						},
					},
				},
			);
			const existingOrganizationId =
				createOrganizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(existingOrganizationId);

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: {
						authorization: `bearer ${adminauthToken}`,
					},
					variables: {
						input: {
							caption: "Unauthorized deletion test",
							organizationId: existingOrganizationId,
							isPinned: false,
						},
					},
				},
			);
			const postId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(postId);

			const deleteResult = await mercuriusClient.mutate(Mutation_deletePost, {
				headers: { authorization: `bearer ${adminauthToken}` },
				variables: { input: { id: postId } },
			});
			assertToBeNonNullish(deleteResult.data.deletePost);

			expect(deleteResult.data.deletePost.id).toEqual(postId);
			expect(Array.isArray(deleteResult.data.deletePost.attachments)).toBe(
				true,
			);
		});
	});
});
